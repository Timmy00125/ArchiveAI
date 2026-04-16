# Frontend State Management — Activity Diagram

Shows how state is managed in each major frontend component using React local state patterns.

```mermaid
flowchart TD
    subgraph ChatState["ChatArea State"]
        ChatMount[Component mounts]
        ChatMount --> HasSession{sessionId<br/>from URL?}
        HasSession -->|Yes| FetchHistory[fetch /chat/history/:id]
        HasSession -->|No| EmptyMessages[messages = []]

        FetchHistory --> SetMessages[setMessages(history)]
        SetMessages --> Ready[Ready for input]

        EmptyMessages --> Ready

        Ready --> UserSends[User types & sends]
        UserSends --> AddUserMsg[setMessages(...prev, userMsg)]
        AddUserMsg --> SetLoading[setIsLoading(true)]
        SetLoading --> APICall[POST /chat/query]
        APICall --> ResponseReceived[Response received]
        ResponseReceived --> AddAssistantMsg[setMessages(...prev, aiMsg)]
        AddAssistantMsg --> UnsetLoading[setIsLoading(false)]

        UnsetLoading --> NewSessionCheck{New session<br/>returned?}
        NewSessionCheck -->|Yes| UpdateURL[router.replace<br/>/chat/sessionId]
        NewSessionCheck -->|No| Ready
        UpdateURL --> Ready
    end

    subgraph DocumentsState["DocumentTable State"]
        DocMount[Component mounts]
        DocMount --> FetchDocs[GET /documents]
        FetchDocs --> SetDocs[setDocuments(list)]

        UploadTrigger[DocumentUpload completes]
        UploadTrigger --> BumpRefresh[setRefreshTrigger(n+1)]

        DeleteTrigger[User deletes document]
        DeleteTrigger --> BumpRefresh

        BumpRefresh --> useEffectRefresh[useEffect on refreshTrigger]
        useEffectRefresh --> FetchDocs
    end

    subgraph SearchState["SearchUI State"]
        SearchMount[Component mounts]
        SearchMount --> EmptyState[query='', results=[],<br/>hasSearched=false]

        EmptyState --> UserTypes[User types query]
        UserTypes --> SetQuery[setQuery(input)]

        UserSubmits[User submits search]
        UserSubmits --> SetLoadingSearch[setIsLoading(true)]
        SetLoadingSearch --> SearchAPI[POST /search {query}]
        SearchAPI --> SetResults[setResults(data)]
        SetResults --> SetHasSearched[setHasSearched(true)]
        SetHasSearched --> UnsetSearchLoading[setIsLoading(false)]
    end

    subgraph SidebarState["AppSidebar State"]
        SidebarMount[Component mounts]
        SidebarMount --> FetchSessions[GET /chat/sessions]
        FetchSessions --> SetRecentChats[setRecentChats(sessions)]

        PathChange[Route change detected<br/>usePathname()]
        PathChange --> FetchSessions
    end

    style ChatState fill:#1a1a2e,stroke:#e94560,color:#f0f0ec
    style DocumentsState fill:#16213e,stroke:#0f3460,color:#f0f0ec
    style SearchState fill:#1a1a2e,stroke:#533483,color:#f0f0ec
    style SidebarState fill:#0a0a0a,stroke:#2d6a4f,color:#f0f0ec
```
