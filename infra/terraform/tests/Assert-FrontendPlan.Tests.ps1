$ErrorActionPreference = "Stop"

$terraformRoot = Split-Path -Parent $PSScriptRoot
$auditScript = Join-Path $terraformRoot "scripts/Assert-FrontendPlan.ps1"
$fixtures = Join-Path $PSScriptRoot "fixtures"

if (-not (Test-Path -LiteralPath $auditScript -PathType Leaf)) {
  throw "Audit script does not exist: $auditScript"
}

$powerShellExecutable = (Get-Process -Id $PID).Path
$cases = @(
  @{
    Name = "accepts every allowlisted type and ignores data reads"
    Fixture = "safe-create-noop.json"
    ExitCode = 0
    Output = @(
      "Approved: aws_s3_bucket.frontend [create]"
      "Approved: aws_iam_role_policy.github_deploy [no-op]"
      "Plan audit passed: 15 managed resource change(s) approved."
    )
  }
  @{
    Name = "rejects updates"
    Fixture = "unsafe-update.json"
    ExitCode = 1
    Output = @("Rejected action array for aws_s3_bucket.frontend: [update]")
  }
  @{
    Name = "rejects deletes"
    Fixture = "unsafe-delete.json"
    ExitCode = 1
    Output = @("Rejected action array for aws_s3_bucket.frontend: [delete]")
  }
  @{
    Name = "rejects replacements"
    Fixture = "unsafe-replace.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_cloudfront_distribution.frontend' must have exactly one")
  }
  @{
    Name = "rejects unexpected managed types"
    Fixture = "unsafe-type.json"
    ExitCode = 1
    Output = @("Unexpected managed resource type 'aws_lambda_function'")
  }
  @{
    Name = "rejects action arrays with extra entries"
    Fixture = "unsafe-extra-action.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_iam_role.github_deploy' must have exactly one")
  }
  @{
    Name = "rejects action values with unexpected casing"
    Fixture = "unsafe-action-case.json"
    ExitCode = 1
    Output = @("Rejected action array for aws_s3_bucket.frontend: [CREATE]")
  }
  @{
    Name = "rejects managed types with unexpected casing"
    Fixture = "unsafe-type-case.json"
    ExitCode = 1
    Output = @("Unexpected managed resource type 'AWS_S3_BUCKET'")
  }
  @{
    Name = "rejects unexpected resource modes"
    Fixture = "unsafe-mode.json"
    ExitCode = 1
    Output = @("Unexpected resource mode 'ephemeral'")
  }
  @{
    Name = "rejects resource modes with unexpected casing"
    Fixture = "unsafe-mode-case.json"
    ExitCode = 1
    Output = @("Unexpected resource mode 'DATA'")
  }
  @{
    Name = "rejects mixed array resource modes"
    Fixture = "unsafe-mode-mixed-array.json"
    ExitCode = 1
    Output = @("Resource change property 'mode' must be a scalar string.")
  }
  @{
    Name = "rejects single-value array resource modes"
    Fixture = "unsafe-mode-single-array.json"
    ExitCode = 1
    Output = @("Resource change property 'mode' must be a scalar string.")
  }
  @{
    Name = "rejects array-valued addresses"
    Fixture = "unsafe-address-array.json"
    ExitCode = 1
    Output = @("Resource change property 'address' must be a scalar string.")
  }
  @{
    Name = "rejects numeric addresses"
    Fixture = "unsafe-address-number.json"
    ExitCode = 1
    Output = @("Resource change property 'address' must be a scalar string.")
  }
  @{
    Name = "rejects array-valued managed types"
    Fixture = "unsafe-type-array.json"
    ExitCode = 1
    Output = @("Resource change property 'type' must be a scalar string.")
  }
  @{
    Name = "rejects numeric managed types"
    Fixture = "unsafe-type-number.json"
    ExitCode = 1
    Output = @("Resource change property 'type' must be a scalar string.")
  }
  @{
    Name = "rejects array-valued resource changes"
    Fixture = "unsafe-resource-change-array.json"
    ExitCode = 1
    Output = @("resource_changes must contain only JSON objects.")
  }
  @{
    Name = "rejects array-valued change objects"
    Fixture = "unsafe-change-array.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'change' must be a JSON object.")
  }
  @{
    Name = "rejects scalar actions properties"
    Fixture = "unsafe-actions-scalar.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'actions' must be a JSON array.")
  }
  @{
    Name = "rejects nested action arrays"
    Fixture = "unsafe-action-nested-array.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' must have exactly one")
  }
  @{
    Name = "rejects numeric action values"
    Fixture = "unsafe-action-number.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' must have exactly one")
  }
  @{
    Name = "rejects null action values"
    Fixture = "unsafe-action-null.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' must have exactly one")
  }
  @{
    Name = "rejects missing mode properties"
    Fixture = "unsafe-mode-missing.json"
    ExitCode = 1
    Output = @("Resource change property 'mode' must be a scalar string.")
  }
  @{
    Name = "rejects null mode properties"
    Fixture = "unsafe-mode-null.json"
    ExitCode = 1
    Output = @("Resource change property 'mode' must be a scalar string.")
  }
  @{
    Name = "rejects missing address properties"
    Fixture = "unsafe-address-missing.json"
    ExitCode = 1
    Output = @("Resource change property 'address' must be a scalar string.")
  }
  @{
    Name = "rejects null address properties"
    Fixture = "unsafe-address-null.json"
    ExitCode = 1
    Output = @("Resource change property 'address' must be a scalar string.")
  }
  @{
    Name = "rejects missing type properties"
    Fixture = "unsafe-type-missing.json"
    ExitCode = 1
    Output = @("Resource change property 'type' must be a scalar string.")
  }
  @{
    Name = "rejects null type properties"
    Fixture = "unsafe-type-null.json"
    ExitCode = 1
    Output = @("Resource change property 'type' must be a scalar string.")
  }
  @{
    Name = "rejects missing change properties"
    Fixture = "unsafe-change-missing.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'change' must be a JSON object.")
  }
  @{
    Name = "rejects null change properties"
    Fixture = "unsafe-change-null.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'change' must be a JSON object.")
  }
  @{
    Name = "rejects missing actions properties"
    Fixture = "unsafe-actions-missing.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'actions' must be a JSON array.")
  }
  @{
    Name = "rejects null actions properties"
    Fixture = "unsafe-actions-null.json"
    ExitCode = 1
    Output = @("Managed resource 'aws_s3_bucket.frontend' property 'actions' must be a JSON array.")
  }
  @{
    Name = "rejects malformed data-source addresses before ignoring reads"
    Fixture = "unsafe-data-address-array.json"
    ExitCode = 1
    Output = @("Resource change property 'address' must be a scalar string.")
  }
  @{
    Name = "rejects malformed data-source actions before ignoring reads"
    Fixture = "unsafe-data-action-nested-array.json"
    ExitCode = 1
    Output = @("Data resource 'data.aws_caller_identity.current' must have exactly one")
  }
  @{
    Name = "rejects array-valued plan roots"
    Fixture = "unsafe-root-array.json"
    ExitCode = 1
    Output = @("Plan JSON root must be a JSON object.")
  }
  @{
    Name = "rejects a missing resource_changes array"
    Fixture = "unsafe-missing-resource-changes.json"
    ExitCode = 1
    Output = @("Plan JSON must contain a resource_changes array.")
  }
  @{
    Name = "rejects malformed JSON"
    Fixture = "unsafe-malformed.txt"
    ExitCode = 1
    Output = @("Could not parse plan JSON")
  }
)

$failures = @()

foreach ($case in $cases) {
  $fixturePath = Join-Path $fixtures $case.Fixture
  $ErrorActionPreference = "Continue"
  $output = & $powerShellExecutable -NoLogo -NoProfile -NonInteractive -File $auditScript -PlanJsonPath $fixturePath 2>&1 | Out-String
  $actualExitCode = $LASTEXITCODE
  $ErrorActionPreference = "Stop"

  if ($actualExitCode -ne $case.ExitCode) {
    $failures += "$($case.Name): expected exit $($case.ExitCode), received $actualExitCode.`n$output"
    continue
  }

  foreach ($expectedOutput in $case.Output) {
    if (-not $output.Contains($expectedOutput)) {
      $failures += "$($case.Name): output did not contain '$expectedOutput'.`n$output"
    }
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { [Console]::Error.WriteLine($_) }
  exit 1
}

Write-Output "Assert-FrontendPlan tests passed: $($cases.Count) cases."
