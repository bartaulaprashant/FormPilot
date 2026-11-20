const FIELD_DEFINITIONS = [
  {
    key: "fullName",
    aliases: [
      "full name",
      "fullname",
      "complete name",
      "applicant name",
      "your full name",
      "your name",
      "name"
    ],
    autocomplete: ["name"],
  },
  {
    key: "firstName",
    aliases: ["first name", "firstname", "given name", "fname"],
    autocomplete: ["given-name"],
  },
  {
    key: "middleName",
    aliases: ["middle name", "middlename", "middle initial"],
    autocomplete: ["additional-name"],
  },
  {
    key: "lastName",
    aliases: ["last name", "lastname", "surname", "family name", "lname"],
    autocomplete: ["family-name"],
  },
  {
    key: "email",
    aliases: ["email", "email address", "e-mail"],
    autocomplete: ["email"],
  },
  {
    key: "phone",
    aliases: ["phone", "mobile", "telephone", "contact number", "phone number"],
    autocomplete: ["tel", "mobile"],
  },
  {
    key: "dateOfBirth",
    aliases: ["date of birth", "birth date", "dob", "birthday"],
    autocomplete: ["bday"],
  },
  {
    key: "currentStreet",
    aliases: ["current street", "current address", "street address", "address"],
    autocomplete: ["street-address"],
  },
  {
    key: "currentCity",
    aliases: ["current city", "city", "town"],
    autocomplete: ["address-level2"],
  },
  {
    key: "currentProvince",
    aliases: ["province", "state", "region"],
    autocomplete: ["address-level1"],
  },
  {
    key: "currentCountry",
    aliases: ["country"],
    autocomplete: ["country-name", "country"],
  },
  {
    key: "portfolio",
    aliases: ["portfolio", "portfolio url", "personal website"],
    autocomplete: ["url"],
  },
  {
    key: "linkedin",
    aliases: ["linkedin", "linkedin url", "linkedin profile"],
  },
  {
    key: "github",
    aliases: ["github", "github url", "github profile"],
  },
  {
    key: "summary",
    aliases: ["professional summary", "profile summary", "about me", "bio"],
  },
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getFieldText(field) {
  return normalize(
    [field.label, field.name, field.id, field.placeholder]
      .filter(Boolean)
      .join(" "),
  );
}

function getFieldValue(data, path) {
  return path.split(".").reduce((value, key) => value?.[key], data);
}

function buildCandidates(data) {
  const candidates = FIELD_DEFINITIONS.map((definition) => ({
    key: definition.key,
    label: definition.key,
    aliases: definition.aliases,
    autocomplete: definition.autocomplete || [],
    value: getFieldValue(data.profile || {}, definition.key),
    source: "Profile",
  }));

  const profileCandidates = {
    portfolio: data.profile?.links?.portfolio,
    linkedin: data.profile?.links?.linkedin,
    github: data.profile?.links?.github,
  };

  candidates.forEach((candidate) => {
    if (profileCandidates[candidate.key] !== undefined) {
      candidate.value = profileCandidates[candidate.key];
    }
  });

  const addressFields = [
    {
      key: "currentStreet",
      value: data.profile?.address?.current?.street,
    },
    {
      key: "currentCity",
      value: data.profile?.address?.current?.city,
    },
    {
      key: "currentProvince",
      value: data.profile?.address?.current?.province,
    },
    {
      key: "currentCountry",
      value: data.profile?.address?.current?.country,
    },
  ];

  addressFields.forEach((field) => {
    const candidate = candidates.find((item) => item.key === field.key);
    if (candidate) candidate.value = field.value;
  });

  // Education records
  (data.education || []).forEach((record) => {
    candidates.push(
      {
        key: "education.institution",
        label: "Institution",
        aliases: ["institution", "school", "college", "university"],
        value: record.institution,
        source: "Education",
      },
      {
        key: "education.degree",
        label: "Degree",
        aliases: ["degree", "qualification", "academic qualification"],
        value: record.degree,
        source: "Education",
      },
      {
        key: "education.fieldOfStudy",
        label: "Field of Study",
        aliases: ["field of study", "major", "specialization", "subject"],
        value: record.fieldOfStudy,
        source: "Education",
      },
      {
        key: "education.grade",
        label: "Grade",
        aliases: ["grade", "gpa", "cgpa", "percentage", "marks"],
        value: record.grade,
        source: "Education",
      },
    );
  });

  // Experience records
  (data.experience || []).forEach((record) => {
    candidates.push(
      {
        key: "experience.company",
        label: "Company",
        aliases: ["company", "employer", "organization"],
        value: record.company,
        source: "Experience",
      },
      {
        key: "experience.position",
        label: "Position",
        aliases: ["position", "job title", "designation", "role"],
        value: record.position,
        source: "Experience",
      },
      {
        key: "experience.location",
        label: "Work Location",
        aliases: ["work location", "company location"],
        value: record.location,
        source: "Experience",
      },
      {
        key: "experience.description",
        label: "Job Description",
        aliases: ["job description", "work description", "responsibilities"],
        value: record.description,
        source: "Experience",
      },
    );
  });

  // Skills
  if (data.skills?.length) {
    candidates.push({
      key: "skills",
      label: "Skills",
      aliases: ["skills", "technical skills", "key skills"],
      value: data.skills
        .map((skill) => skill.name)
        .filter(Boolean)
        .join(", "),
      source: "Skills",
    });
  }

  // Certifications
  (data.certifications || []).forEach((record) => {
    candidates.push(
      {
        key: "certification.name",
        label: "Certification",
        aliases: ["certification", "certificate", "certification name"],
        value: record.name,
        source: "Certifications",
      },
      {
        key: "certification.issuer",
        label: "Issuing Organization",
        aliases: ["issuing organization", "certification issuer"],
        value: record.issuer,
        source: "Certifications",
      },
      {
        key: "certification.credentialId",
        label: "Credential ID",
        aliases: ["credential id", "certificate id"],
        value: record.credentialId,
        source: "Certifications",
      },
    );
  });

  // Custom fields
  (data.customFields || []).forEach((record) => {
    candidates.push({
      key: `custom.${record.id}`,
      label: record.label,
      aliases: [record.label],
      value: record.value,
      source: "Custom Fields",
    });
  });

  return candidates.filter(
    (candidate) =>
      candidate.value !== undefined &&
      candidate.value !== null &&
      String(candidate.value).trim() !== "",
  );
}

function calculateScore(field, candidate) {
  const fieldText = getFieldText(field);
  const autocomplete = normalize(field.autocomplete);
  let score = 0;

  // Strongest signal: exact autocomplete match
  if (
    candidate.autocomplete?.some((value) =>
      autocomplete.split(" ").includes(normalize(value)),
    )
  ) {
    score += 100;
  }

  const aliases = candidate.aliases.map(normalize);

  for (const alias of aliases) {
    if (!alias) continue;

    if (fieldText === alias) {
      score = Math.max(score, 100);
    } else if (fieldText.includes(alias)) {
      score = Math.max(score, 85);
    } else if (alias.includes(fieldText) && fieldText.length >= 4) {
      score = Math.max(score, 65);
    }
  }

  // Additional signal from matching individual words
  const fieldWords = new Set(
    fieldText.split(" ").filter((word) => word.length > 2),
  );

  for (const alias of aliases) {
    const aliasWords = alias.split(" ").filter((word) => word.length > 2);

    if (!aliasWords.length) continue;

    const matched = aliasWords.filter((word) => fieldWords.has(word)).length;
    const wordScore = (matched / aliasWords.length) * 50;

    score = Math.max(score, wordScore);
  }

  return Math.min(score, 100);
}

export function matchFields(fields, data) {
  const candidates = buildCandidates(data);

  return fields.map((field) => {
    const matches = candidates
      .map((candidate) => ({
        ...candidate,
        confidence: calculateScore(field, candidate),
      }))
      .filter((candidate) => candidate.confidence >= 50)
      .sort((a, b) => b.confidence - a.confidence);

    const bestMatch = matches[0];

    return {
      fieldIndex: field.fieldIndex,
      field,
      match: bestMatch || null,
      confidence: bestMatch?.confidence || 0,
    };
  });
}
