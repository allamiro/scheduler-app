#!/bin/bash

# Comprehensive Docker Compose Logging Script
# This script provides detailed logging for all services

echo "🔍 DUTY SCHEDULER - COMPREHENSIVE LOGGING SYSTEM"
echo "=================================================="

# Function to show logs with timestamps
show_logs() {
    local service=$1
    local lines=${2:-20}
    
    echo -e "\n📋 $service SERVICE LOGS (Last $lines lines):"
    echo "----------------------------------------"
    docker compose logs $service --tail=$lines --timestamps
}

# Function to show real-time logs
show_realtime_logs() {
    local service=$1
    echo -e "\n🔄 REAL-TIME LOGS FOR $service:"
    echo "Press Ctrl+C to stop"
    docker compose logs $service --follow --timestamps
}

# Function to check service health
check_health() {
    echo -e "\n🏥 SERVICE HEALTH CHECK:"
    echo "========================"
    
    # Check if services are running
    echo "Service Status:"
    docker compose ps
    
    echo -e "\nHealth Checks:"
    
    # Web service
    echo -n "Web Service: "
    curl -s -I http://localhost:3001 | head -1 || echo "❌ Not accessible"
    
    # API service
    echo -n "API Service: "
    curl -s http://localhost:8001/health | head -c 50 || echo "❌ Not accessible"
    
    # Database
    echo -n "Database: "
    docker compose exec db pg_isready -U scheduler_user -d scheduler_db 2>/dev/null && echo "✅ Ready" || echo "❌ Not ready"
    
    # Redis
    echo -n "Redis: "
    docker compose exec cache redis-cli ping 2>/dev/null && echo "✅ Ready" || echo "❌ Not ready"
}

# Function to test API endpoints
test_api() {
    echo -e "\n🧪 API ENDPOINT TESTING:"
    echo "========================"
    
    # Test login
    echo "Testing login..."
    TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "username=admin&password=admin" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$TOKEN" ]; then
        echo "✅ Login successful"
        
        # Test authenticated endpoints
        echo "Testing /api/auth/me..."
        curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/auth/me | head -c 100
        echo -e "\n"
        
        echo "Testing /api/doctors/..."
        curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/doctors/ | head -c 100
        echo -e "\n"
        
        echo "Testing /api/schedules/week/..."
        curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/schedules/week/2025-09-22 | head -c 100
        echo -e "\n"
    else
        echo "❌ Login failed"
    fi
}

# Function to show database status
check_database() {
    echo -e "\n🗄️ DATABASE STATUS:"
    echo "=================="
    
    echo "Database Connection:"
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT version();" 2>/dev/null || echo "❌ Connection failed"
    
    echo -e "\nUser Roles Enum:"
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT unnest(enum_range(NULL::userrole));" 2>/dev/null || echo "❌ Enum query failed"
    
    echo -e "\nUsers Table:"
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT id, username, role, is_active FROM users;" 2>/dev/null || echo "❌ Users query failed"
    
    echo -e "\nDoctors Table:"
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "SELECT COUNT(*) as doctor_count FROM doctors;" 2>/dev/null || echo "❌ Doctors query failed"
}

# Function to fix database issues
fix_database() {
    echo -e "\n🔧 FIXING DATABASE ISSUES:"
    echo "========================="
    
    echo "Fixing userrole enum..."
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'VIEWER';" 2>/dev/null && echo "✅ Enum fixed" || echo "❌ Enum fix failed"
    
    echo "Creating missing users..."
    docker compose exec db psql -U scheduler_user -d scheduler_db -c "
        INSERT INTO users (username, email, hashed_password, role, is_active) 
        VALUES ('viewer', 'viewer@scheduler.com', '\$2b\$12\$test', 'VIEWER', true)
        ON CONFLICT (username) DO NOTHING;" 2>/dev/null && echo "✅ Users created" || echo "❌ User creation failed"
}

# Main menu
case "${1:-menu}" in
    "all")
        show_logs web 30
        show_logs api 30
        show_logs db 20
        show_logs cache 10
        show_logs proxy 10
        ;;
    "web")
        show_logs web ${2:-20}
        ;;
    "api")
        show_logs api ${2:-20}
        ;;
    "db")
        show_logs db ${2:-20}
        ;;
    "cache")
        show_logs cache ${2:-10}
        ;;
    "proxy")
        show_logs proxy ${2:-10}
        ;;
    "follow")
        show_realtime_logs ${2:-api}
        ;;
    "health")
        check_health
        ;;
    "test")
        test_api
        ;;
    "db-status")
        check_database
        ;;
    "fix-db")
        fix_database
        ;;
    "full-debug")
        check_health
        test_api
        check_database
        show_logs web 10
        show_logs api 20
        show_logs db 10
        ;;
    *)
        echo "Usage: $0 [command] [lines]"
        echo ""
        echo "Commands:"
        echo "  all          - Show logs from all services"
        echo "  web [lines]  - Show web service logs"
        echo "  api [lines]  - Show API service logs"
        echo "  db [lines]   - Show database logs"
        echo "  cache [lines]- Show Redis logs"
        echo "  proxy [lines]- Show Caddy logs"
        echo "  follow [svc] - Follow real-time logs"
        echo "  health       - Check service health"
        echo "  test         - Test API endpoints"
        echo "  db-status    - Check database status"
        echo "  fix-db       - Fix database issues"
        echo "  full-debug   - Complete debugging session"
        echo ""
        echo "Examples:"
        echo "  $0 all"
        echo "  $0 api 50"
        echo "  $0 follow api"
        echo "  $0 full-debug"
        ;;
esac
