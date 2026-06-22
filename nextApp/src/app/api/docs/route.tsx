import { NextResponse } from "next/server";

const swaggerJson = {
  openapi: "3.0.0",
  info: {
    title: "Challenge App API",
    version: "1.2.0",
    description: "Full API for user management, groups, and daily photo challenges."
  },
  servers: [{ url: "https://localhost:8443" }],
  paths: {
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "Get all users",
        description: "Returns a list of all users without password hashes. Requires an active session.",
        responses: {
          "200": {
            description: "Users fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string", example: "user-id-123" },
                      username: { type: "string", example: "john_doe" },
                      email: { type: "string", example: "john@example.com" },
                      role: { 
                        type: "string", 
                        example: "USER",
                        description: "User role"
                      },
                      created_at: {
                        type: "string",
                        format: "date-time",
                        example: "2024-01-01T12:00:00.000Z"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" }
                  }
                }
              }
            }
          },
          "405": {
            description: "Method not allowed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Method not allowed" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Internal server error" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/roles": {
      get: {
        tags: ["Auth"],
        summary: "Get available roles",
        description: "Returns the list of assignable roles. Requires an active admin session.",
        responses: {
          "200": {
            description: "Roles fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "string",
                    example: "admin"
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized"
          },
          "403": {
            description: "Forbidden"
          }
        }
      }
    },
    "/api/auth/users/{id}/role": {
      patch: {
        tags: ["Auth"],
        summary: "Update a user's role",
        description: "Updates the role of a target user. Requires an active admin session.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", example: "admin" }
                },
                required: ["role"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Role updated successfully"
          },
          "400": {
            description: "Invalid role or invalid user id"
          },
          "401": {
            description: "Unauthorized"
          },
          "403": {
            description: "Forbidden"
          },
          "404": {
            description: "User not found"
          }
        }
      }
    },
    // 1. User Registration
    "/api/auth/register": {
      "post": {
        "tags": ["Auth"],
        "summary": "User registration",
        "description": "Password is hashed. Backend validation is applied. Returns the created user's id, username, and email.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "username": { "type": "string" },
                  "email": { "type": "string", "format": "email" },
                  "password": { "type": "string" }
                },
                "required": ["username", "email", "password"]
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "id": { "type": "number" },
                    "username": { "type": "string" },
                    "email": { "type": "string", "format": "email" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Missing required fields",
            "content": { "application/json": { "schema": { "type": "object", "properties": { "error": { "type": "string" } } } } }
          },
          "409": {
            "description": "User already exists",
            "content": { "application/json": { "schema": { "type": "object", "properties": { "error": { "type": "string" } } } } }
          },
          "500": {
            "description": "Internal server error",
            "content": { "application/json": { "schema": { "type": "object", "properties": { "error": { "type": "string" } } } } }
          }
        }
      }
    },
    // 2. User Login
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login",
        description: "Rate limited. Returns session cookie and user ID.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "user@example.com" },
                  password: { type: "string", example: "yourPassword123" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful. Session cookie set.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "user-id-123" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Missing email or password",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string", example: "email and password are required" } } }
              }
            }
          },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string", example: "Invalid credentials" } } }
              }
            }
          },
          "405": {
            description: "Method not allowed",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string", example: "Method not allowed" } } }
              }
            }
          },
          "429": {
            description: "Too many login attempts",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string", example: "Too many login attempts. Try again later." } } }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: { type: "object", properties: { error: { type: "string", example: "Internal server error" } } }
              }
            }
          }
        }
      }
    },
    // 3. User Logout
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "User logout",
        description: "Invalidates the current session and clears the session cookie.",
        responses: {
          "200": {
            description: "Logout successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Logged out successfully" }
                  }
                }
              }
            }
          },
          "405": {
            description: "Method not allowed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Method not allowed" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Internal server error" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        description: "Returns the currently authenticated user's profile based on the active session.",
        responses: {
          "200": {
            description: "Authenticated user data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", example: "user-id-123" },
                    username: { type: "string", example: "john_doe" },
                    email: { type: "string", example: "john@example.com" },
                    role: { type: "string", example: "USER" },
                    created_at: {
                      type: "string",
                      format: "date-time",
                      example: "2024-01-01T12:00:00.000Z"
                    }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Unauthorized" }
                  }
                }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "User not found" }
                  }
                }
              }
            }
          },
          "405": {
            description: "Method not allowed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: { type: "string", example: "Method not allowed" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Internal server error"
          }
        }
      }
    },
    "/api/auth/{id}": {
    put: {
      tags: ["Auth"],
      summary: "Update user",
      description: "Fully updates a user. Username and email are required. Role is optional and can be empty.",
      parameters: [
        {
          name: "id",
          in: "path",
          required: true,
          schema: { type: "integer" },
          example: 123
        }
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                username: { type: "string", example: "john_doe" },
                email: { type: "string", format: "email", example: "john@example.com" },
                role: { type: "string", nullable: true, example: "admin" }
              },
              required: ["username", "email"]
            }
          }
        }
      },
      responses: {
        "200": {
          description: "User updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer" },
                  username: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string", nullable: true }
                }
              }
            }
          }
        },
        "400": {
          description: "Missing or invalid fields",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string", example: "username and email are required" }
                }
              }
            }
          }
        },
        "401": {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { error: { type: "string" } }
              }
            }
          }
        },
        "404": {
          description: "User not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { error: { type: "string" } }
              }
            }
          }
        },
        "409": {
          description: "Email or username already in use",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { error: { type: "string" } }
              }
            }
          }
        },
        "500": {
          description: "Internal server error"
        }
      }
    },
      delete: {
        tags: ["Auth"],
        summary: "Delete user",
        description: "Deletes a user by ID.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
            example: 123
          }
        ],
        responses: {
          "204": { description: "User deleted successfully" },
          "401": { description: "Unauthorized" },
          "404": { description: "User not found" },
          "500": { description: "Internal server error" }
        }
      }
    }
  }
};

export async function GET() {
	return NextResponse.json(swaggerJson);
}
