
export const DB_NAME = "FormPilotDB";
export const DB_VERSION = 1;

export const STORES = {
  PROFILE: "profile",
  EDUCATION: "education",
  EXPERIENCE: "experience",
  SKILLS: "skills",
  CERTIFICATIONS: "certifications",
  DOCUMENTS: "documents",
  CUSTOM_FIELDS: "customFields",
  SETTINGS: "settings"
};

export const STORE_CONFIG = {
  [STORES.PROFILE]: {
    keyPath: "id",
    indexes: []
  },

  [STORES.EDUCATION]: {
    keyPath: "id",
    indexes: [
      { name: "institution", keyPath: "institution" },
      { name: "endDate", keyPath: "endDate" }
    ]
  },

  [STORES.EXPERIENCE]: {
    keyPath: "id",
    indexes: [
      { name: "company", keyPath: "company" },
      { name: "position", keyPath: "position" }
    ]
  },

  [STORES.SKILLS]: {
    keyPath: "id",
    indexes: [
      { name: "name", keyPath: "name" },
      { name: "category", keyPath: "category" }
    ]
  },

  [STORES.CERTIFICATIONS]: {
    keyPath: "id",
    indexes: [
      { name: "name", keyPath: "name" },
      { name: "issuer", keyPath: "issuer" }
    ]
  },

  [STORES.DOCUMENTS]: {
    keyPath: "id",
    indexes: [
      { name: "mimeType", keyPath: "mimeType" },
      { name: "createdAt", keyPath: "createdAt" }
    ]
  },

  [STORES.CUSTOM_FIELDS]: {
    keyPath: "id",
    indexes: [
      { name: "category", keyPath: "category" },
      { name: "label", keyPath: "label" }
    ]
  },

  [STORES.SETTINGS]: {
    keyPath: "key",
    indexes: []
  }
};
