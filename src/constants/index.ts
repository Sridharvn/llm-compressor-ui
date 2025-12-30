export const SAMPLE_JSON = {
  "metadata": {
    "session_id": "chat_9823471",
    "timestamp": "2025-12-30T10:00:00Z",
    "user": {
      "id": "usr_442",
      "preferences": {
        "theme": "dark",
        "notifications": true,
        "languages": ["en", "es", "fr"]
      }
    }
  },
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant specialized in data compression."
    },
    {
      "role": "user",
      "content": "Can you analyze this complex data structure and tell me how to optimize it for LLM token usage?"
    },
    {
      "role": "assistant",
      "content": "I can certainly help with that. Using schema separation and key abbreviation can significantly reduce token counts."
    }
  ],
  "context_window": {
    "limit": 128000,
    "current_usage": 450,
    "history": [
      {"event": "login", "status": "success"},
      {"event": "query", "type": "optimization"},
      {"event": "response", "latency_ms": 120}
    ]
  }
};

export const LARGE_SAMPLE_JSON = {
  "system_info": {
    "version": "2.4.0",
    "environment": "production",
    "features": ["auth", "billing", "analytics", "search", "notifications", "webhooks"]
  },
  "user_data": Array.from({ length: 10 }).map((_, i) => ({
    "id": `user_${i}`,
    "name": `User ${i}`,
    "email": `user${i}@example.com`,
    "role": i === 0 ? "admin" : "user",
    "status": "active",
    "last_login": "2025-12-30T10:00:00Z",
    "metadata": {
      "login_count": 42 + i,
      "preferences": {
        "theme": "dark",
        "lang": "en"
      }
    }
  })),
  "recent_logs": Array.from({ length: 5 }).map((_, i) => ({
    "timestamp": "2025-12-30T10:05:00Z",
    "level": "info",
    "message": `System event ${i} occurred successfully`,
    "context": {
      "request_id": `req_abc123_${i}`,
      "duration_ms": 100 + i * 10
    }
  }))
};

export const DEFAULT_OPTIONS = {
  aggressive: false,
  unsafe: false,
};
