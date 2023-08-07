
# TalkZone - Video Conferencing Website



## Table of Contents
* [About TalkZone](#about-talkzone)
* [Video Demonstration](#video-demonstration)
* [Key Features](#key-features)
    - [Collaborative Whiteboard](#collaborative-whiteboard)
    - [Screen Share](#screen-share)
    - [Chat Section](#chat-section)
    - [View All Participants](#view-all-participants)
    - [Invite More Participants](#invite-more-participants)
    - [Stop/Start Audio and Video](#stopstart-audio-and-video)
    - [Leave Meeting](#leave-meeting)
    - [Schedule a Meeting](#schedule-a-meeting)
* [Tech Stack Used](#tech-stack-used)
* [Libraries Used](#libraries-used)
* [Installation](#installation)
* [Images of Working App](#images-of-working-app)


## About TalkZone
TalkZone is a web-based video conferencing application that allows users to easily connect and communicate with each other in real-time using WebRTC technology. It utilizes Express, Socket.io and PeerJS libraries to establish peer-to-peer connections. Additionally, it offers features such as screen sharing, whiteboard sharing, real-time chatbox and much more.
## [Video Demonstration](https://drive.google.com/file/d/1851LWB5BhKlXBmT1cXzsxgFgUzfc7vN6/view?usp=sharing)
## Key Features
### Collaborative Whiteboard
Collaborate with participants in real-time on a shareable whiteboard. Draw, annotate, erase and brainstorm ideas together during the meeting.

### Screen Share
Share your screen with other participants to demonstrate presentations, documents, or any application in real-time.

### Chat Section
Interact with other participants through a real-time chat section. Exchange messages and links with ease during the meeting.

### View All Participants
See a list of all participants currently in the meeting, along with their display names.

### Invite More Participants
Generate a unique Room ID and share it with others to invite them to join the meeting.

### Stop/Start Audio and Video
Easily toggle your audio and video on/off during the meeting for better control over your presence.

### Leave Meeting
Leave the meeting with a click of a button.

### Schedule a Meeting
Schedule a meeting at a specified date and time. It automatically sends out reminder emails to all the attendees 15 minutes prior to the specified meet time.
 

## Tech Stack Used
- HTML
- CSS
- JavaScript
- WebRTC
- Node.js
- Bootstrap

## Libraries Used
- Socket.io
- Express
- PeerJS
- Nodemailer
- PassportJS
- uuid

## Installation

- Clone the repository by opening your terminal and navigating to the directory where you want to clone the repository. Then, run the following command:
```bash
  git clone https://github.com/t-kadre/TalkZone
```

- Navigate to the App Directory:
```bash
  cd TalkZone
```

- Install the required dependencies using npm package manager:
```bash
  npm install
```
- Start the development server:
```bash
  npm run devStart
```
- Access the website by visiting 'http://localhost:3000'

## Images of Working App
- Google OAuth 2.0 authentication page:
![Google OAuth 2.0 authentication page](https://github.com/t-kadre/TalkZone/assets/106656556/c282a724-7fee-460a-836f-e75ca7d98f63)

- Home page:
![homepage](https://github.com/t-kadre/TalkZone/assets/106656556/a9d71272-48f4-4423-9660-5ae8ce5b6dd4)

- Room layout:
![room layout](https://github.com/t-kadre/TalkZone/assets/106656556/97c2bdde-91eb-4dda-babe-10df1e42f7d1)

- Screen sharing feature:
![share screen](https://github.com/t-kadre/TalkZone/assets/106656556/d1e64efa-477b-469b-8d6a-c9228b03e816)

- Whiteboard feature:
![whiteboard](https://github.com/t-kadre/TalkZone/assets/106656556/159daf2d-2df9-4df7-a52c-d2cdef6513bf)

- Schedule Meeting:
![schedule meeting](https://github.com/t-kadre/TalkZone/assets/106656556/502ee085-ecbc-4b1e-aedc-734ca44aef22)

