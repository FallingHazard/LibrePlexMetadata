export type LibreplexCreator = {
  "version": "0.9.0",
  "name": "libreplex_creator",
  "instructions": [
    {
      "name": "createCreator",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "creator"
              },
              {
                "kind": "arg",
                "type": {
                  "defined": "CreateCreatorInput"
                },
                "path": "create_creator_input.seed"
              }
            ]
          }
        },
        {
          "name": "minterNumbers",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "creatorInput",
          "type": {
            "defined": "CreateCreatorInput"
          }
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "updateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "relations": [
            "update_authority"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "UpdateInput"
          }
        }
      ]
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "relations": [
            "mint_authority"
          ]
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "groupPermissions",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterNumbers",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "libreplexMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recentSlothashes",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "attributeConfig",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "attributeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "current",
            "type": "u32"
          },
          {
            "name": "maxOnchainAttributeCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          },
          {
            "name": "seed",
            "type": "publicKey"
          },
          {
            "name": "supply",
            "type": "u32"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "assetUrl",
            "type": {
              "defined": "AssetUrl"
            }
          },
          {
            "name": "minted",
            "type": "u32"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "description",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "attributeMappings",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "isOrdered",
            "type": "bool"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "minterNumbers",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "mintNumbers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AttributeUpdate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "EditAttributeConfigInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "update",
            "type": {
              "vec": {
                "defined": "AttributeUpdate"
              }
            }
          },
          {
            "name": "add",
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    },
    {
      "name": "CreateCreatorInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxMints",
            "type": "u32"
          },
          {
            "name": "seed",
            "type": "publicKey"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "assetUrl",
            "type": {
              "defined": "AssetUrl"
            }
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "description",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "attributeMappings",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          },
          {
            "name": "isOrdered",
            "type": "bool"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "UpdateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "AssetUrl",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "JsonPrefix",
            "fields": [
              {
                "name": "url",
                "type": "string"
              }
            ]
          },
          {
            "name": "ImagePrefix",
            "fields": [
              {
                "name": "url",
                "type": "string"
              },
              {
                "name": "description",
                "type": {
                  "option": "string"
                }
              }
            ]
          },
          {
            "name": "ChainRenderer",
            "fields": [
              {
                "name": "program_id",
                "type": "publicKey"
              },
              {
                "name": "description",
                "type": {
                  "option": "string"
                }
              },
              {
                "name": "output_address",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Json",
            "fields": [
              {
                "name": "url_config",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Image",
            "fields": [
              {
                "name": "image_config",
                "type": "publicKey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "AccountEventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Create"
          },
          {
            "name": "Update"
          },
          {
            "name": "Delete"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "MintEvent",
      "fields": [
        {
          "name": "group",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "number",
          "type": "u32",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "holder",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "AccountEvent",
      "fields": [
        {
          "name": "reference",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "eventType",
          "type": {
            "defined": "AccountEventType"
          },
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MissingMintNumbers",
      "msg": "Missing mint numbers"
    },
    {
      "code": 6001,
      "name": "WrongMintNumbers",
      "msg": "Wrong mint numbers"
    },
    {
      "code": 6002,
      "name": "MissingAttributeConfig",
      "msg": "Attribute config missing"
    },
    {
      "code": 6003,
      "name": "SoldOut",
      "msg": "Sold out"
    }
  ]
};

export const IDL: LibreplexCreator = {
  "version": "0.9.0",
  "name": "libreplex_creator",
  "instructions": [
    {
      "name": "createCreator",
      "accounts": [
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "type": "string",
                "value": "creator"
              },
              {
                "kind": "arg",
                "type": {
                  "defined": "CreateCreatorInput"
                },
                "path": "create_creator_input.seed"
              }
            ]
          }
        },
        {
          "name": "minterNumbers",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "creatorInput",
          "type": {
            "defined": "CreateCreatorInput"
          }
        }
      ]
    },
    {
      "name": "update",
      "accounts": [
        {
          "name": "updateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "relations": [
            "update_authority"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": "UpdateInput"
          }
        }
      ]
    },
    {
      "name": "mint",
      "accounts": [
        {
          "name": "buyer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": false,
          "relations": [
            "mint_authority"
          ]
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "groupPermissions",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "minterNumbers",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "libreplexMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "recentSlothashes",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "attributeConfig",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "attributeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "current",
            "type": "u32"
          },
          {
            "name": "maxOnchainAttributeCount",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "updateAuthority",
            "type": "publicKey"
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          },
          {
            "name": "seed",
            "type": "publicKey"
          },
          {
            "name": "supply",
            "type": "u32"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "assetUrl",
            "type": {
              "defined": "AssetUrl"
            }
          },
          {
            "name": "minted",
            "type": "u32"
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "description",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "attributeMappings",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "isOrdered",
            "type": "bool"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "minterNumbers",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "mintNumbers",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AttributeUpdate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u32"
          },
          {
            "name": "data",
            "type": "bytes"
          }
        ]
      }
    },
    {
      "name": "EditAttributeConfigInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "update",
            "type": {
              "vec": {
                "defined": "AttributeUpdate"
              }
            }
          },
          {
            "name": "add",
            "type": {
              "vec": "bytes"
            }
          }
        ]
      }
    },
    {
      "name": "CreateCreatorInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxMints",
            "type": "u32"
          },
          {
            "name": "seed",
            "type": "publicKey"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "assetUrl",
            "type": {
              "defined": "AssetUrl"
            }
          },
          {
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "description",
            "type": {
              "option": "string"
            }
          },
          {
            "name": "attributeMappings",
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "mintAuthority",
            "type": "publicKey"
          },
          {
            "name": "isOrdered",
            "type": "bool"
          },
          {
            "name": "name",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "UpdateInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mintAuthority",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "AssetUrl",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "JsonPrefix",
            "fields": [
              {
                "name": "url",
                "type": "string"
              }
            ]
          },
          {
            "name": "ImagePrefix",
            "fields": [
              {
                "name": "url",
                "type": "string"
              },
              {
                "name": "description",
                "type": {
                  "option": "string"
                }
              }
            ]
          },
          {
            "name": "ChainRenderer",
            "fields": [
              {
                "name": "program_id",
                "type": "publicKey"
              },
              {
                "name": "description",
                "type": {
                  "option": "string"
                }
              },
              {
                "name": "output_address",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Json",
            "fields": [
              {
                "name": "url_config",
                "type": "publicKey"
              }
            ]
          },
          {
            "name": "Image",
            "fields": [
              {
                "name": "image_config",
                "type": "publicKey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "AccountEventType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Create"
          },
          {
            "name": "Update"
          },
          {
            "name": "Delete"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "MintEvent",
      "fields": [
        {
          "name": "group",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "number",
          "type": "u32",
          "index": false
        },
        {
          "name": "authority",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "holder",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "AccountEvent",
      "fields": [
        {
          "name": "reference",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "eventType",
          "type": {
            "defined": "AccountEventType"
          },
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MissingMintNumbers",
      "msg": "Missing mint numbers"
    },
    {
      "code": 6001,
      "name": "WrongMintNumbers",
      "msg": "Wrong mint numbers"
    },
    {
      "code": 6002,
      "name": "MissingAttributeConfig",
      "msg": "Attribute config missing"
    },
    {
      "code": 6003,
      "name": "SoldOut",
      "msg": "Sold out"
    }
  ]
};
