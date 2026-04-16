# Error Handling & HTTP Status Codes — Activity Diagram

Shows how different error conditions are detected and mapped to HTTP responses.

```mermaid
flowchart TD
    Start((Request Received)) --> RouteHandler{Route Handler}

    RouteHandler -->|Validation fails| Err400[400 Bad Request<br/>Missing/invalid params<br/>Unsupported file type<br/>File too large]

    RouteHandler -->|Resource not found| Err404[404 Not Found<br/>Session not found<br/>Document not found]

    RouteHandler -->|LLM call| LLMError{LLM Error?}

    LLMError -->|Rate limit exceeded| Detect429[Parse error string<br/>for quota/rate limit]
    Detect429 --> Err429[429 Too Many Requests<br/>Extract retry-after<br/>from error message]

    LLMError -->|API key invalid| Detect503[Detect authentication<br/>error from string]
    Detect503 --> Err503[503 Service Unavailable<br/>API key issue]

    LLMError -->|Upstream error| Err502[502 Bad Gateway<br/>LLM provider error]

    LLMError -->|Success| ProcessResponse[Process Response]

    RouteHandler -->|Database unavailable| Fallback{Fallback Available?}

    Fallback -->|Yes, MemorySaver| DegradedMode[Operate in degraded mode<br/>Log warning]
    Fallback -->|No| Err500[500 Internal Server Error]

    ProcessResponse --> Success[200 OK<br/>JSON or SSE response]

    Err400 --> ClientError[Client receives error<br/>toast.error() in frontend]
    Err404 --> ClientError
    Err429 --> ClientError
    Err502 --> ClientError
    Err503 --> ClientError
    Err500 --> ClientError

    DegradedMode --> Success
    Success --> End((End))
    ClientError --> End

    style Start fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style End fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style Err400 fill:#533483,stroke:#0a0a0a,color:#f0f0ec
    style Err404 fill:#533483,stroke:#0a0a0a,color:#f0f0ec
    style Err429 fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style Err502 fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style Err503 fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style Err500 fill:#e94560,stroke:#0a0a0a,color:#f0f0ec
    style Success fill:#2d6a4f,stroke:#0a0a0a,color:#f0f0ec
```

## Error Code Summary

| Status | Condition | Detection Method |
|--------|-----------|-----------------|
| 400 | Missing filename, empty query, unsupported extension, file too large | Direct validation in route handler |
| 404 | Session ID not in database, document not in ChromaDB | Database query returns empty |
| 429 | Gemini API quota exceeded | String matching on LLM error message + retry-after extraction |
| 502 | Gemini API upstream error | Generic LLM call failure |
| 503 | Invalid or missing API key | String matching on authentication error |
| 500 | Unhandled exception, no fallback available | Catch-all exception handler |
