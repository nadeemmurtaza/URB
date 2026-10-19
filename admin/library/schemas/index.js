// Generated from library/schemas by scripts/sync-library.mjs. Do not edit.
export const schemas = {
  "bom": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "BillOfMaterials",
    "type": "object",
    "required": [
      "id",
      "lines"
    ],
    "properties": {
      "id": {
        "type": "string",
        "minLength": 1
      },
      "lines": {
        "type": "array",
        "items": {
          "type": "object"
        }
      },
      "labourMin": {
        "type": "number",
        "minimum": 0,
        "maximum": 6000
      },
      "notes": {
        "type": "string",
        "maxLength": 600
      }
    }
  },
  "customer": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Customer",
    "type": "object",
    "required": [
      "name",
      "phone"
    ],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 80
      },
      "phone": {
        "type": "string",
        "minLength": 7,
        "maxLength": 20
      },
      "email": {
        "type": "string",
        "pattern": "^\\S+@\\S+\\.\\S+$"
      },
      "city": {
        "type": "string"
      },
      "notes": {
        "type": "string",
        "maxLength": 600
      }
    }
  },
  "enquiry": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Enquiry",
    "type": "object",
    "required": [
      "name",
      "brief"
    ],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 2
      },
      "brief": {
        "type": "string",
        "minLength": 3,
        "maxLength": 1200
      },
      "status": {
        "type": "string",
        "enum": [
          "new",
          "quoted",
          "won",
          "closed"
        ]
      },
      "quote": {
        "type": "number",
        "minimum": 0
      }
    }
  },
  "material": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Material",
    "type": "object",
    "required": [
      "name",
      "unit",
      "cost"
    ],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 80
      },
      "kind": {
        "type": "string",
        "enum": [
          "yarn",
          "wire",
          "wrap",
          "ribbon",
          "filler",
          "packaging",
          "hardware",
          "other"
        ]
      },
      "unit": {
        "type": "string",
        "enum": [
          "g",
          "m",
          "pc",
          "sheet",
          "ml"
        ]
      },
      "cost": {
        "type": "number",
        "minimum": 0
      },
      "stock": {
        "type": "number",
        "minimum": 0
      },
      "reorder": {
        "type": "number",
        "minimum": 0
      },
      "pack": {
        "type": "number",
        "minimum": 0
      },
      "supplier": {
        "type": "string",
        "maxLength": 120
      }
    }
  },
  "order": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Order",
    "type": "object",
    "required": [
      "customer",
      "items",
      "total"
    ],
    "properties": {
      "id": {
        "type": "string"
      },
      "status": {
        "type": "string",
        "enum": [
          "new",
          "confirmed",
          "preparing",
          "dispatched",
          "delivered",
          "cancelled"
        ]
      },
      "payment": {
        "type": "string",
        "enum": [
          "unpaid",
          "paid",
          "refunded"
        ]
      },
      "total": {
        "type": "number",
        "minimum": 0
      },
      "items": {
        "type": "array"
      },
      "customer": {
        "type": "object"
      }
    }
  },
  "product": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Product",
    "type": "object",
    "required": [
      "name",
      "price"
    ],
    "properties": {
      "id": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 80
      },
      "price": {
        "type": "integer",
        "minimum": 0
      },
      "was": {
        "type": "integer",
        "minimum": 0
      },
      "stock": {
        "type": "integer",
        "minimum": 0
      },
      "fee": {
        "type": "integer",
        "minimum": 0
      },
      "line": {
        "type": "string",
        "maxLength": 240
      },
      "inside": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        }
      },
      "active": {
        "type": "boolean"
      },
      "img": {
        "type": "string"
      }
    }
  },
  "promo": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "PromoCode",
    "type": "object",
    "required": [
      "code",
      "pct"
    ],
    "properties": {
      "code": {
        "type": "string",
        "minLength": 3,
        "maxLength": 20,
        "pattern": "^[A-Za-z0-9_-]+$"
      },
      "pct": {
        "type": "integer",
        "minimum": 1,
        "maximum": 90
      },
      "active": {
        "type": "boolean"
      },
      "expires": {
        "type": "string"
      },
      "limit": {
        "type": "integer",
        "minimum": 0
      }
    }
  }
}
