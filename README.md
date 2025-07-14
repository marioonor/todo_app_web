# Full-Stack To-Do Application

This is a full-stack To-Do list application featuring a modern Angular frontend and a robust Spring Boot backend. It provides user authentication and two different views for managing tasks: a classic list view and an interactive Kanban board.

## Features

- **User Authentication**: Secure user registration and login functionality.
- **CRUD Operations**: Create, Read, Update, and Delete (CRUD) to-do items.
- **Dual Views**:
  - **List View**: A simple, tabular view of all to-do items.
  - **Kanban View**: An interactive, drag-and-drop board to manage tasks by status (Pending, In Progress, Completed, Cancelled).
- **Responsive Design**: A clean user interface built with Bootstrap that works on various devices.
- **Token-based Security**: The backend is set up for token-based authentication to secure the API.

## Technologies Used

### Frontend (`todoapp_web`)

- **Angular**: A powerful framework for building dynamic single-page applications.
- **TypeScript**: For type-safe JavaScript development.
- **Bootstrap**: For responsive and modern UI components.
- **Angular CDK**: Used for the drag-and-drop functionality in the Kanban board.
- **RxJS**: For reactive programming and managing asynchronous operations.

### Backend (`todoapp`)

- **Java**: The core programming language for the backend.
- **Spring Boot**: For creating stand-alone, production-grade Spring-based applications.
- **Spring Security**: (Inferred) For handling authentication and authorization.
- **JPA / Hibernate**: (Inferred) For object-relational mapping and database interaction.
- **Maven/Gradle**: (Inferred) For project build and dependency management.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **Java Development Kit (JDK)**: Version 17 or later.
- **Node.js and npm**: Latest LTS version recommended.
- **Angular CLI**: `npm install -g @angular/cli`
- **A relational database**: Such as PostgreSQL, MySQL, or H2.

### Backend Setup (`todoapp`)

1.  **Navigate to the backend directory:**
    ```bash
    cd todoapp
    ```

2.  **Configure the database:**
    Open `src/main/resources/application.properties` and update the `spring.datasource.*` properties to match your database configuration.

3.  **Build and run the application:**
    You can run the application using your IDE by running the `LogintodoappApplication.java` file, or from the command line:
    ```bash
    # If using Maven
    ./mvnw spring-boot:run

    # If using Gradle
    ./gradlew bootRun
    ```

4.  The backend API will be running on `http://localhost:8080`.

### Frontend Setup (`todoapp_web`)

1.  **Navigate to the frontend directory:**
    ```bash
    cd todoapp_web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    ng serve
    ```

4.  Open your browser and navigate to `http://localhost:4200`. The application will automatically reload if you change any of the source files.

## Project Structure

The project is organized into two main directories:

- `todoapp/`: Contains the Spring Boot backend application.
- `todoapp_web/`: Contains the Angular frontend application.

This separation allows for independent development and deployment of the frontend and backend.
