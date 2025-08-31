# Smart School Attendance & Pattern Detection System

A comprehensive offline-capable school attendance management system built with Spring Boot and JavaFX, featuring advanced pattern detection and analytics.

## 🎯 Features

### Core Functionality
- **Teacher Authentication**: Secure login with role-based access control
- **Attendance Management**: Mark, update, and track student attendance with undo functionality
- **Pattern Detection**: Automatic analysis of attendance patterns and trends
- **Offline Operation**: Embedded H2 database for complete offline functionality
- **Beautiful UI**: Blue-themed JavaFX interface with modern design

### Advanced Features
- **Dashboard Analytics**: Real-time statistics and visual insights
- **Student Management**: Add, edit, and manage student records
- **Comprehensive Reports**: Generate detailed attendance reports with export options
- **Admin Panel**: Complete system administration for users and classes
- **Data Security**: Encrypted passwords and secure authentication

## 🛠 Technical Stack

- **Backend**: Spring Boot 3.2.0
- **Frontend**: JavaFX 21
- **Database**: H2 (Embedded, file-based)
- **Security**: Spring Security with JWT
- **Build Tool**: Maven
- **Java Version**: 17+

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- IDE (IntelliJ IDEA, Eclipse, or VS Code)

## 🚀 Getting Started

### 1. Clone and Setup
```bash
# Create project directory
mkdir smart-attendance-system
cd smart-attendance-system

# Copy all the provided Java files to their respective directories
# Follow the package structure as shown in the files
```

### 2. Build and Run
```bash
# Build the project
mvn clean compile

# Run the application
mvn spring-boot:run
```

### 3. Alternative: Run with JavaFX Maven Plugin
```bash
mvn javafx:run
```

## 📁 Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/school/attendance/
│   │       ├── SmartAttendanceApplication.java
│   │       ├── config/
│   │       │   ├── SecurityConfig.java
│   │       │   └── DataInitializer.java
│   │       ├── entity/
│   │       │   ├── User.java
│   │       │   ├── Student.java
│   │       │   ├── SchoolClass.java
│   │       │   └── AttendanceRecord.java
│   │       ├── repository/
│   │       │   ├── UserRepository.java
│   │       │   ├── StudentRepository.java
│   │       │   ├── SchoolClassRepository.java
│   │       │   └── AttendanceRecordRepository.java
│   │       ├── service/
│   │       │   ├── UserService.java
│   │       │   ├── StudentService.java
│   │       │   ├── SchoolClassService.java
│   │       │   └── AttendanceService.java
│   │       ├── security/
│   │       │   ├── JwtTokenProvider.java
│   │       │   ├── UserPrincipal.java
│   │       │   ├── CustomUserDetailsService.java
│   │       │   ├── JwtAuthenticationEntryPoint.java
│   │       │   └── JwtAuthenticationFilter.java
│   │       └── ui/
│   │           ├── JavaFXApplication.java
│   │           ├── controller/
│   │           │   ├── LoginController.java
│   │           │   ├── MainController.java
│   │           │   ├── DashboardController.java
│   │           │   ├── AttendanceController.java
│   │           │   ├── StudentsController.java
│   │           │   ├── ReportsController.java
│   │           │   └── AdminController.java
│   │           └── util/
│   │               ├── SceneManager.java
│   │               └── AlertUtil.java
│   └── resources/
│       ├── application.properties
│       ├── fxml/
│       │   ├── login.fxml
│       │   └── main.fxml
│       └── css/
│           └── styles.css
```

## 🔐 Default Credentials

- **Admin**: `admin` / `admin123`
- **Teacher**: `teacher1` / `teacher123`

## 💾 Database

The application uses H2 embedded database with file-based storage:
- **Location**: `./data/attendance_db.mv.db`
- **Console**: Available at `http://localhost:8080/h2-console` (development only)
- **Connection**: `jdbc:h2:file:./data/attendance_db`

## 🎨 UI Features

### Login Screen
- Clean, modern design with blue theme
- Demo credentials display
- Loading indicators and status messages

### Main Application
- Responsive sidebar navigation
- Role-based menu visibility
- Real-time data updates
- Professional table layouts

### Attendance Marking
- Intuitive radio button interface
- Bulk operations (Mark All Present/Absent)
- Undo functionality with stack-based logic
- Real-time statistics display

### Dashboard
- Class-wise attendance statistics
- Visual progress indicators
- Recent activity summaries
- Trend analysis

## 📊 Pattern Detection

The system automatically analyzes attendance patterns:

- **Excellent**: >95% attendance
- **Consistent**: 85-95% attendance  
- **Irregular**: 70-85% attendance with gaps
- **Low**: <70% attendance

### Trend Analysis
- **Improving**: Recent attendance better than historical
- **Declining**: Recent attendance worse than historical
- **Stable**: Consistent attendance pattern

## 🔧 Configuration

### Application Properties
```properties
# Database Configuration
spring.datasource.url=jdbc:h2:file:./data/attendance_db
spring.datasource.username=sa
spring.datasource.password=password

# JWT Configuration
app.jwt.secret=smartAttendanceSecretKey2024
app.jwt.expiration=86400000

# Server Configuration
server.port=8080
```

### Maven Dependencies
Key dependencies include:
- Spring Boot Starter Web
- Spring Boot Starter Data JPA
- Spring Boot Starter Security
- H2 Database
- JavaFX Controls & FXML
- JWT (JJWT)

## 🚀 Building for Production

### Create Executable JAR
```bash
mvn clean package
java -jar target/smart-attendance-system-1.0.0.jar
```

### Create Native Installer (Java 17+)
```bash
# Using jpackage (requires JDK 17+)
jpackage --input target/ \
         --name "Smart Attendance System" \
         --main-jar smart-attendance-system-1.0.0.jar \
         --main-class com.school.attendance.SmartAttendanceApplication \
         --type msi
```

## 🔍 Troubleshooting

### Common Issues

1. **JavaFX Runtime Error**
   ```bash
   # Add JavaFX modules to runtime
   java --module-path /path/to/javafx/lib --add-modules javafx.controls,javafx.fxml -jar app.jar
   ```

2. **Database Lock Error**
   - Ensure only one instance is running
   - Delete `./data/attendance_db.lock.db` if exists

3. **Port Already in Use**
   - Change server port in `application.properties`
   - Or kill process using port 8080

## 📈 Future Enhancements

- QR Code-based attendance
- Mobile app integration
- Email notifications for low attendance
- Advanced reporting with charts
- Backup/restore to cloud storage
- Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Email: support@smartattendance.com
- Documentation: [Wiki](https://github.com/yourrepo/wiki)

---

**Smart School Attendance System** - Making attendance management intelligent and efficient! 🎓✨