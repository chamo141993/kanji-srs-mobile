# Week 3 Progress Report: Kanji SRS Application

## What I Did
This week focused heavily on network routing, data ingestion, and establishing system auditing:
-Network & Routing: Successfully diagnosed and resolved the Cross-Origin Resource Sharing (CORS) errors that were blocking the decoupled Netlify frontend from communicating with the Render backend. 
-Database Implementation: Implemented the current data setup that allows the application to successfully parse and utilize the massive JSON vocabulary library downloaded from WaniKani.
-Security & Telemetry: Integrated the `winston` library into the Node.js backend to establish centralized telemetry, formatting all application events, access attempts, and errors into structured JSON logs.

## Why I Did It That Way
Fixing the CORS policy was a strict requirement for a secure decoupled architecture; rather than leaving the API open to the public, I specifically whitelisted the Netlify domain to prevent unauthorized websites from querying the backend. For the database, ingesting the WaniKani JSON provided a robust, static data layer that bypassed the complexities of browser-based SQLite limitations. Finally, I chose `winston` for logging because standard `console.log()` outputs are messy and unstandardized. Winston forces the application to output clean, structured JSON telemetry, which is an absolute necessity when sending logs to a modern cloud provider.

## How it Ties to the Learning Objectives

-Describe the problems an enterprise must deal with because there is no standardized log/audit record format: Standard syslog records can be incredibly difficult to parse automatically because the text formatting is often inconsistent. By implementing `winston` to generate structured JSON logs, I solved this enterprise problem at the application level. Every log now has a predictable key-value structure, making it trivial for a cloud platform to ingest, search, and analyze.

-Describe the benefits of a loghost: Because my backend is hosted on Render within a distroless container, it does not have a persistent local hard drive to save log files. Render acts as my remote loghost. It captures the stdout stream of my Winston logs in real-time, centralizing them in a cloud dashboard. This ensures that even if the Docker container crashes or resets, the audit trail is securely preserved off-site.

-Compare and contrast the Windows audit system with the Unix syslog audit system: Working with custom JSON telemetry in a Linux container highlighted the differences in audit philosophies. Unix `syslog` is highly decentralized, relying on OS-level daemons, facilities, and severities, which can lead to formatting fragmentation. Conversely, Windows Event Logs use a highly structured, centralized format (similar to XML). By using Winston, I essentially brought the benefits of highly structured, Windows-style event logging into a lightweight Unix/Linux container environment.

-Describe the need for log rotation and how it is performed: While my current cloud provider manages temporary log retention, integrating a robust logger like Winston prepares the application for file-based log rotation (e.g., using `winston-daily-rotate-file`). Without log rotation, appending massive amounts of JSON audit data to a single file would eventually consume all available disk space, leading to a Denial of Service.