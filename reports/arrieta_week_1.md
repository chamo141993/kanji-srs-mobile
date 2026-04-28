# Week 1 Progress Report: Kanji SRS Application

## What I Did
This week, I formalized the project by sending the initial proposal email for the Kanji SRS application. I wanted to take this opportunity to leverage a coding agent to assess how good of a job it could do and learn how to use such a tool. After some research, I chose to use the the oh-my-codex (OMX) platform. Through which I prompted the tool to create a similar application (in learning style) to the wanikani kanji learning site. On the technical side, it successfully built a frontend usign the React Native library (javaScript) and got it running live on a physical Android device using the Expo Go app over a local network. I also hosted the initial set up on the nps gitlab to establish an earliy CI/CD framework.

## Why I Did It That Way
I chose to build and deploy the frontend via Expo Go first to establish a working, decoupled User Interface (UI). By getting a "minimum viable product" running on a physical device early, I could validate the app's basic functionality and data flow requirements before investing time into building the secure backend infrastructure. This architecture ensures the UI and the database/security logic remain completely separated, which was identified as one of the security objectives from the beginning.

## How it Ties to the Learning Objectives

-Describe the intent and importance of a security plan:Drafting the initial proposal and building the live prototype served as the practical catalyst for needing a security plan. Seeing the app function on a physical device highlighted exactly what assets (the Kanji data, user inputs) and architecture (mobile frontend talking to a future backend) the upcoming security plan will need to protect. It set the baseline requirements.

-Identify example scenarios as threats, vulnerabilities or controls: Deploying the prototype via Expo Go on a local network allowed me to actively identify early vulnerabilities in the architecture. Because the app currently lacks a secure backend, it is vulnerable to unauthenticated access and data manipulation. Identifying these baseline vulnerabilities is the first step toward designing the necessary controls (like Docker containerization, mock JWTs, and secure cloud syncing) that I will implement in the coming weeks.