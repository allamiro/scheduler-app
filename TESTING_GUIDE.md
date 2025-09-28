# Duty Scheduler - Testing Guide

## 🚀 Application Status

✅ **All services are running successfully!**

- **Frontend**: http://localhost:3001
- **API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Proxy**: http://localhost:8081

## 🔐 Default Credentials

- **Admin**: username=`admin`, password=`admin`
- **Editor**: username=`editor`, password=`editor`

## 📋 Test Cases

### 1. Authentication Testing

#### Login Test
```bash
# Test admin login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"

# Test editor login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=editor&password=editor"
```

**Expected Result**: Returns JWT token with `access_token` and `token_type: "bearer"`

#### Get Current User Test
```bash
# Replace TOKEN with actual token from login
curl -H "Authorization: Bearer TOKEN" http://localhost:8001/api/auth/me
```

**Expected Result**: Returns user information (id, username, email, role, is_active)

### 2. Doctor Management Testing

#### List Doctors
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8001/api/doctors/
```

**Expected Result**: Returns array of 10 sample doctors

#### Create Doctor
```bash
curl -X POST http://localhost:8001/api/doctors/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test User",
    "email": "test@hospital.com",
    "phone": "+251911234599",
    "is_active": true
  }'
```

**Expected Result**: Returns created doctor with assigned ID

#### Update Doctor
```bash
curl -X PUT http://localhost:8001/api/doctors/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Updated Name",
    "email": "updated@hospital.com",
    "phone": "+251911234599",
    "is_active": true
  }'
```

**Expected Result**: Returns updated doctor information

### 3. Schedule Management Testing

#### Create Schedule
```bash
curl -X POST http://localhost:8001/api/schedules/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "week_start": "2024-01-01"
  }'
```

**Expected Result**: Returns created schedule with 7 empty days

#### Get Schedule by Week
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8001/api/schedules/week/2024-01-01"
```

**Expected Result**: Returns schedule for the specified week

#### Create Assignment
```bash
curl -X POST http://localhost:8001/api/schedules/1/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "assignment_date": "2024-01-01",
    "assignment_type": "ULTRASOUND_MORNING"
  }'
```

**Expected Result**: Returns created assignment

### 4. Capacity Validation Testing

#### Test Capacity Limit
```bash
# Try to assign more doctors than capacity allows
curl -X POST http://localhost:8001/api/schedules/1/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 2,
    "assignment_date": "2024-01-01",
    "assignment_type": "CT_SCAN"
  }'
```

**Expected Result**: Should succeed (CT_SCAN capacity = 1)

```bash
# Try to assign second doctor to CT_SCAN (should fail)
curl -X POST http://localhost:8001/api/schedules/1/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 3,
    "assignment_date": "2024-01-01",
    "assignment_type": "CT_SCAN"
  }'
```

**Expected Result**: Should return error about capacity exceeded

### 5. Double Booking Validation Testing

#### Test Double Booking Prevention
```bash
# Assign doctor to morning shift
curl -X POST http://localhost:8001/api/schedules/1/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "assignment_date": "2024-01-01",
    "assignment_type": "ULTRASOUND_MORNING"
  }'

# Try to assign same doctor to afternoon shift (should fail)
curl -X POST http://localhost:8001/api/schedules/1/assignments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "assignment_date": "2024-01-01",
    "assignment_type": "ULTRASOUND_AFTERNOON"
  }'
```

**Expected Result**: Second assignment should fail with double booking error

### 6. Publishing Testing

#### Publish Schedule
```bash
curl -X POST http://localhost:8001/api/published/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schedule_id": 1,
    "title": "Test Published Schedule",
    "description": "Test publication"
  }'
```

**Expected Result**: Returns published schedule with unique slug

#### Access Published Schedule
```bash
# Replace SLUG with actual slug from publish response
curl http://localhost:3001/p/SLUG
```

**Expected Result**: Returns read-only schedule page

### 7. Frontend Testing

#### Manual UI Testing
1. **Login Page**: Navigate to http://localhost:3001
   - Test login with admin/admin
   - Test login with editor/editor
   - Test invalid credentials

2. **Dashboard Page**: After successful login
   - Verify week navigator works
   - Test drag-and-drop functionality
   - Verify doctor sidebar shows all doctors
   - Test adding new doctors
   - Test publishing schedules

3. **Published Pages**: 
   - Navigate to published schedule URLs
   - Verify read-only access
   - Test print functionality

### 8. Unit Testing

#### Run Backend Tests
```bash
docker compose exec api python -m pytest tests/ -v
```

**Expected Result**: All tests should pass

#### Test Validation Logic
```bash
docker compose exec api python -c "
from tests.test_validation import *
print('Running validation tests...')
test_capacity_validation()
test_double_booking_validation()
print('All validation tests passed!')
"
```

## 🐛 Common Issues & Solutions

### Issue: Port Already in Use
**Solution**: The application uses these ports:
- Frontend: 3001
- API: 8001
- Database: 5433
- Redis: 6380
- Proxy: 8081

### Issue: Database Connection Failed
**Solution**: Ensure all services are healthy:
```bash
docker compose ps
```

### Issue: Frontend Build Failed
**Solution**: Rebuild frontend:
```bash
docker compose up -d --build web
```

### Issue: API Health Check Failed
**Solution**: Check API logs:
```bash
docker compose logs api
```

## 📊 Performance Testing

### Load Testing
```bash
# Test API response times
time curl -H "Authorization: Bearer TOKEN" http://localhost:8001/api/doctors/

# Test concurrent requests
for i in {1..10}; do
  curl -H "Authorization: Bearer TOKEN" http://localhost:8001/api/doctors/ &
done
wait
```

### Database Performance
```bash
# Check database connections
docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT count(*) FROM users;"
docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT count(*) FROM doctors;"
docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT count(*) FROM schedules;"
```

## ✅ Success Criteria

The application is considered fully functional when:

1. ✅ All services start without errors
2. ✅ Authentication works for both admin and editor roles
3. ✅ CRUD operations work for doctors, schedules, and assignments
4. ✅ Capacity validation prevents over-assignment
5. ✅ Double booking validation prevents conflicts
6. ✅ Publishing creates immutable snapshots
7. ✅ Frontend displays schedules correctly
8. ✅ Drag-and-drop functionality works
9. ✅ Published pages are accessible and read-only
10. ✅ All unit tests pass

## 🎯 Next Steps

1. **User Acceptance Testing**: Have end users test the application
2. **Performance Optimization**: Monitor and optimize slow queries
3. **Security Testing**: Test for common vulnerabilities
4. **Integration Testing**: Test with external systems
5. **Load Testing**: Test under high concurrent usage

---

**Status**: ✅ **READY FOR PRODUCTION TESTING**
