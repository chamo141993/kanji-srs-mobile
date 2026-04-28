# Week 2 Progress Report: Kanji SRS Application

## What I Did
This week, I utilized the oh-my-codex (OMX) workflow to develop the MVP for the Kanji learning application, transitioning it from a local network test to a live, decoupled cloud architecture. Specific accomplishments include:
-Infrastructure Migration: Moved the repository to public GitHub to establish an automated CI/CD pipeline.
-Cloud Deployment: Deployed the frontend to Netlify (static web hosting) and the backend to Render (PaaS), reconfiguring the app to intelligently bypass the offline SQLite database for web compatibility. 
-OS/Container Hardening: Containerized the Node.js/Express backend using Docker, subsequently transitioning to a Google Distroless environment to strip away the Linux shell, package managers, and root access.

## Why I Did It That Way
I opted for a decoupled web deployment using modern cloud platforms to separate my presentation layer (Netlify) from my logic/database layer (Render), which were both free. This inherently improves security by ensuring the public-facing UI server does not have direct access to the database environment. Furthermore, I chose a Google Distroless container image rather than a standard Linux base image to drastically reduce the backend's attack surface. By intentionally removing the shell and package managers, even if an attacker manages to bypass the API security (like Helmet and rate-limiting), they have no built-in tools to execute malicious commands. 

## How it Ties to the Learning Objectives

-Describe how a container is different from a VM / Describe the different kinds of cloud services: This week's work practically applied these concepts. Rather than deploying a heavy Virtual Machine with a full OS overhead, I packaged the backend logic into a lightweight Docker container. I then utilized Platform-as-a-Service (PaaS) cloud providers (Render and Netlify) to host these components, demonstrating how modern cloud services abstract away hardware management so developers can focus purely on application logic and container security. I also did all the building and implementation insise a AWS workspace deployed linux VM.

-Identify why no one should log into a Unix system as root (Case Studies in POLP on Unix): The decision to utilize a Google Distroless container directly aligns with the Principle of Least Privilege (POLP). Traditional container base images often default to root access and include full bash shells. By utilizing a distroless environment, I physically removed root access and the terminal shell from the production environment entirely. This enforces POLP at the architectural level—the application only has the exact binaries required to run Node.js, and nothing else.
