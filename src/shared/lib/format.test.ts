import { expect, it } from 'vitest'

import { formatStructuredData, sanitizeStructuredData } from './format'

it('redacts common identity and medical fields recursively', () => {
  const result = sanitizeStructuredData({
    full_name: 'Example Person',
    address: 'Example address',
    nested: {
      date_of_birth: '2000-01-01',
      medical_record_number: 'demo-record',
      available_slots: ['Friday 10:00'],
    },
  })

  expect(result).toEqual({
    nested: { available_slots: ['Friday 10:00'] },
  })
})

it('redacts sensitive aliases and naming styles inside arrays', () => {
  const result = sanitizeStructuredData({
    records: [
      {
        Authorization: 'Bearer demo',
        authorizationHeader: 'Bearer demo',
        apiKey: 'demo-key',
        CREDENTIALS: 'demo-credentials',
        sessionCookie: 'session=demo',
        passwordHash: 'demo-hash',
        clientSecret: 'demo-secret',
        refreshToken: 'demo-token',
        patientId: 'demo-patient',
        emailAddress: 'person@example.test',
        phone_number: '555-0100',
        firstName: 'Example',
        last_name: 'Person',
        SSN: '000-00-0000',
        birthDate: '2000-01-01',
        MRN: 'demo-record',
        mobileNumber: '555-0101',
        availableSlots: ['Friday 10:00'],
      },
      {
        access_token: 'demo-token',
        API_KEY: 'demo-key',
        patient_identifier: 'demo-patient',
        birth_date: '2000-01-01',
        mobile_number: '555-0102',
        status: 'available',
      },
    ],
  })

  expect(result).toEqual({
    records: [{ availableSlots: ['Friday 10:00'] }, { status: 'available' }],
  })
})

it('preserves safe keys that only contain sensitive-looking text', () => {
  expect(
    sanitizeStructuredData({
      token_count: 3,
      cookie_policy_url: '/privacy/cookies',
      secretary_available: true,
    }),
  ).toEqual({
    token_count: 3,
    cookie_policy_url: '/privacy/cookies',
    secretary_available: true,
  })
})

it('redacts approved sensitive aliases with trailing qualifiers', () => {
  expect(
    sanitizeStructuredData({
      address_line_1: 'Example address line 1',
      addressLine2: 'Example address line 2',
      PATIENT_NAME: 'Example Person',
      PatientName: 'Example Person',
      medical_record_id: 'demo-record',
      MedicalRecordId: 'demo-record',
      telephone: '555-0100',
      TELEPHONE_NUMBER: '555-0101',
      telephoneNumber: '555-0102',
      token_count: 3,
      cookie_policy_url: '/privacy/cookies',
      secretary_available: true,
    }),
  ).toEqual({
    token_count: 3,
    cookie_policy_url: '/privacy/cookies',
    secretary_available: true,
  })
})

it('redacts normalized sensitive containers at nested key boundaries', () => {
  expect(
    sanitizeStructuredData({
      workflow: {
        patientDetails: { display_name: 'Example Person' },
        intake_patient_name_fields: { given: 'Example' },
        medicalRecordPayload: { record: 'demo-record' },
        archivedMedicalRecordIdValue: 'demo-record-id',
        addressLine3: 'Example address line 3',
        billing_address_line_details: { line: 'Example address' },
        contactDetails: { preferred: 'email' },
        emergency_contact_payload: { telephone: '555-0100' },
        token_count: 3,
        cookie_policy_url: '/privacy/cookies',
        secretary_available: true,
      },
    }),
  ).toEqual({
    workflow: {
      token_count: 3,
      cookie_policy_url: '/privacy/cookies',
      secretary_available: true,
    },
  })
})

it('redacts direct sensitive aliases with explicit value qualifiers', () => {
  expect(
    sanitizeStructuredData({
      nested: {
        email_value: 'person@example.test',
        preferred_phone_payload: { number: '555-0100' },
        refreshTokenValue: 'demo-token',
        token_count: 3,
        cookie_policy_url: '/privacy/cookies',
        secretary_available: true,
      },
    }),
  ).toEqual({
    nested: {
      token_count: 3,
      cookie_policy_url: '/privacy/cookies',
      secretary_available: true,
    },
  })
})

it('formats only sanitized structured data as text', () => {
  expect(
    formatStructuredData({
      apiKey: 'demo-key',
      results: [
        {
          mobile_number: '555-0100',
          available_slot: 'Friday 10:00',
        },
      ],
      token_count: 1,
    }),
  ).toBe(`{
  "results": [
    {
      "available_slot": "Friday 10:00"
    }
  ],
  "token_count": 1
}`)
})
