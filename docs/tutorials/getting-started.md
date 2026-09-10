---
title: 'Getting started'
description: Install the project, run it on a device, send your first message, and run the tests.
category: tutorial
---

# Getting started

By the end of this tutorial you will have rift-chat running on an emulator, you will have sent
a message and watched it survive an app restart, and you will have run the test suite. It
takes about twenty minutes, most of which is the first native build.

## 0. Prerequisite

You need **Node 24**, **Java 17**, and either **Android Studio** (with an emulator) or
**Xcode**. Check what you have:

```bash
node -v      # v24.x
java -version   # 17.x
echo $ANDROID_HOME   # should print a path
```

## 1. Install

```bash
git clone <repository-url> rift-chat
cd rift-chat
npm install
```

`npm install` also sets up the git hooks, so your first commit will be linted automatically.

## 2. Run it

```bash
npm run android      # or: npm run ios
```

That is the whole step. The `android/` and `ios/` folders are not in the repository — they are
generated from `app.json` — but **you do not need to generate them yourself**: `expo run:android`
and `expo run:ios` each run `prebuild` automatically when the folder is missing. This is Expo's
Continuous Native Generation, and it is why you never have to resolve a merge conflict inside a
Gradle file.

You would only run `prebuild` by hand to _force_ a regeneration after changing native config in
`app.json`:

```bash
npx expo prebuild --clean            # both platforms
npx expo prebuild -p android --clean # just Android
```

Both platforms are supported. `-p android` narrows it to one; omitting `-p` generates both. The
app is developed cross-platform, and Android is simply where QA, performance measurement and the
demo recording happen, because the APK is the deliverable.

The first build takes several minutes because Gradle (or Xcode) is compiling the native project
from scratch. Later runs are much faster, and pure JavaScript changes reload instantly without
rebuilding at all.

> **Expo Go will not work.** MMKV and Reanimated need native code that Expo Go does not ship,
> so a development build is required. That is what the commands above produce.

You should land on the **Chats** tab, showing a list of contacts fetched from
`responserift.dev`. Scroll to the bottom and the next page loads automatically.

## 3. Send your first message

Tap any contact. You will see their messages — and, most likely, an empty-looking thread,
because the API only has two or three posts per user. That is expected; the
[message model](../explanation/message-model.md) explains why.

Type something and hit send. Three things happen, and they are worth watching closely:

1. **The bubble appears instantly**, before the network call finishes. That is the optimistic
   update.
2. **A small clock icon** sits under it while the request is in flight, then becomes a tick.
3. **Go back to the Chats tab.** That contact's row now shows your message as the last
   message, with a live timestamp.

Now force-quit the app and reopen it. Your message is still there. It is stored locally,
because the API accepts posts but does not persist them — so the app keeps its own record.

## 4. Negative Tests

Turn on airplane mode and send another message. An offline banner appears, the bubble shows a
red retry icon instead of a tick, and nothing is lost. Turn the network back on: the queued
message sends itself.

This is the failure path working as designed, and it is worth seeing once so you trust it.

## 5. Run the tests

```bash
npm test
```

Then run everything CI runs — type-check, lint, format check, and tests with coverage:

```bash
npm run check
```

This is the same command the pre-push hook runs, so if it passes locally, CI will pass too.

## Where to go next

- **Understand what you just saw** → [Message model](../explanation/message-model.md)
- **Add something** → [How to add a feature](../how-to/add-a-feature.md)
- **Look up a command** → [Commands](../reference/commands.md)
- **Build the APK** → [Run and test](../how-to/run-and-test.md#build-the-release-apk)
