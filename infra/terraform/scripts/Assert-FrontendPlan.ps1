[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$PlanJsonPath
)

$ErrorActionPreference = "Stop"

$allowedManagedTypes = @(
  "aws_s3_bucket"
  "aws_s3_bucket_public_access_block"
  "aws_s3_bucket_ownership_controls"
  "aws_s3_bucket_server_side_encryption_configuration"
  "aws_s3_bucket_versioning"
  "aws_s3_bucket_policy"
  "aws_acm_certificate"
  "aws_acm_certificate_validation"
  "aws_route53_record"
  "aws_cloudfront_origin_access_control"
  "aws_cloudfront_cache_policy"
  "aws_cloudfront_response_headers_policy"
  "aws_cloudfront_distribution"
  "aws_iam_role"
  "aws_iam_role_policy"
)

try {
  if (-not (Test-Path -LiteralPath $PlanJsonPath -PathType Leaf)) {
    throw "Plan JSON file does not exist: $PlanJsonPath"
  }

  try {
    $planJson = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $PlanJsonPath).Path)
    if (-not $planJson.TrimStart().StartsWith("{")) {
      throw "Plan JSON root must be a JSON object."
    }
    $plan = $planJson | ConvertFrom-Json -ErrorAction Stop
  }
  catch {
    throw "Could not parse plan JSON '$PlanJsonPath': $($_.Exception.Message)"
  }

  if ($plan -isnot [PSCustomObject]) {
    throw "Plan JSON root must be a JSON object."
  }

  if ($plan.PSObject.Properties.Name -cnotcontains "resource_changes") {
    throw "Plan JSON must contain a resource_changes array."
  }

  $resourceChanges = $plan.PSObject.Properties["resource_changes"].Value
  if ($resourceChanges -isnot [System.Array]) {
    throw "Plan JSON must contain a resource_changes array."
  }

  $approvedCount = 0

  foreach ($resourceChange in $resourceChanges) {
    if ($resourceChange -isnot [PSCustomObject]) {
      throw "resource_changes must contain only JSON objects."
    }

    foreach ($propertyName in @("mode", "address", "type")) {
      if ($resourceChange.PSObject.Properties.Name -cnotcontains $propertyName) {
        throw "Resource change property '$propertyName' must be a scalar string."
      }

      $propertyValue = $resourceChange.PSObject.Properties[$propertyName].Value
      if ($propertyValue -isnot [string]) {
        throw "Resource change property '$propertyName' must be a scalar string."
      }
    }

    $mode = $resourceChange.PSObject.Properties["mode"].Value
    $address = $resourceChange.PSObject.Properties["address"].Value
    $resourceType = $resourceChange.PSObject.Properties["type"].Value

    if ([string]::IsNullOrWhiteSpace($address) -or [string]::IsNullOrWhiteSpace($resourceType)) {
      throw "Resource change address and type must be non-empty strings."
    }

    if ($mode -cne "managed" -and $mode -cne "data") {
      throw "Unexpected resource mode '$mode' for '$($resourceChange.address)'."
    }

    $resourceLabel = if ($mode -ceq "data") { "Data resource" } else { "Managed resource" }

    if ($resourceChange.PSObject.Properties.Name -cnotcontains "change") {
      throw "$resourceLabel '$address' property 'change' must be a JSON object."
    }

    $change = $resourceChange.PSObject.Properties["change"].Value
    if ($change -isnot [PSCustomObject]) {
      throw "$resourceLabel '$address' property 'change' must be a JSON object."
    }

    if ($change.PSObject.Properties.Name -cnotcontains "actions") {
      throw "$resourceLabel '$address' property 'actions' must be a JSON array."
    }

    $actions = $change.PSObject.Properties["actions"].Value
    if ($actions -isnot [System.Array]) {
      throw "$resourceLabel '$address' property 'actions' must be a JSON array."
    }

    if ($actions.Count -ne 1 -or $actions[0] -isnot [string]) {
      throw "$resourceLabel '$address' must have exactly one scalar string action."
    }

    if ($mode -ceq "data") {
      continue
    }

    if ($allowedManagedTypes -cnotcontains $resourceType) {
      throw "Unexpected managed resource type '$resourceType' at '$address'."
    }

    $action = $actions[0]
    if ($action -cnotin @("create", "no-op")) {
      $actionList = $actions -join ", "
      throw "Rejected action array for ${address}: [$actionList]. Only exactly [create] or [no-op] is allowed."
    }

    Write-Output "Approved: $address [$action]"
    $approvedCount += 1
  }

  Write-Output "Plan audit passed: $approvedCount managed resource change(s) approved."
}
catch {
  [Console]::Error.WriteLine("Plan audit failed: $($_.Exception.Message)")
  exit 1
}
