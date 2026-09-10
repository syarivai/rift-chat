Task Assessment: Mobile Developer

### Objective

You are required to create a chat app with the necessary functionality to list contacts messages, view contact chat messages, send messages, view contact profiles. The purpose of this assignment is to assess your skills in React Native where performance, state management, React Query (caching, mutations, infinite queries, optimistic updates), app architecture and UI/UX will be evaluated. Give a brief of overview of the project structure and other architectural design elements you would want to highlight in a README.md file. You are allowed to use any Al tools as long as you explain how it aided in your development.

### Technology

You are required to use the following technologies:

- React Native (with or without Expo)
- React Query for API caching
- State Management library ie Zustand, Redux, Mob (any of choice)
- Any UI library (optional - any of choice)

### Tools

The API you will use is [https://responserift.dev/]. You may use api/users for contacts, api/posts as messages. You are required to develop the following features in your Application.

### Features to Implement

1. Bottom Tabs
   1. Chat Tab
   2. Settings Tab
2. Chats Tab Screen
   1. Fetch list of conversations `GET api/users`
   2. Each Item shows
      1. Avatar
      2. Name
      3. Last message (placeholder)
      4. Timestamp (placeholder)
   3. Pagination (infinite scroll)
   4. Tap item navigates to Chat Screen
3. Chat Screen
   1. Shows a list of messages by user `GET api/posts`
   2. Message input at bottom of screen
   3. Send text message `POST api/posts`
   4. Optimistically update the mutation
   5. Tap on header with contact avatar navigates to Profile Screen
4. Profile Screen
   1. Basic User Info
      1. Name
      2. Avatar
      3. Phone Number
   2. Use React Query for profile fetching
   3. Add simple Block/Unblock toggle stored in global state
5. Settings Screen
   1. Basic static info eg your name, app version

### Optional (Nice to Have)

- Smooth transitions
- Automation tests
- Performance optimization
- Empty view placeholders

### Code Submission

- Use the public Github Repository for the code and share the link when submitting, including screenshots and/or screen recordings of the app in the Readme.md.
- The deadline for this task is four (4) days from the time you receive this email.
- An APK file will be required which should be committed to the same repository. (important)
