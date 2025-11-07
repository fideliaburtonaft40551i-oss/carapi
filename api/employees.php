<?php
require_once 'config.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendJSON(['success' => true]);
}

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get all employees
            $stmt = $pdo->query("
                SELECT 
                    e.id,
                    e.name,
                    e.role,
                    e.position,
                    e.shift,
                    e.user_id
                FROM employees e
                ORDER BY e.name ASC
            ");
            $employees = $stmt->fetchAll();
            
            // Format response
            $response = array_map(function($emp) {
                return [
                    'id' => $emp['id'],
                    'name' => $emp['name'],
                    'role' => $emp['role'],
                    'position' => $emp['position'],
                    'shift' => $emp['shift']
                ];
            }, $employees);
            
            sendJSON($response);
            break;

        case 'POST':
            // Create new employee
            $input = getJSONInput();
            
            if (!isset($input['name']) || !isset($input['position']) || !isset($input['shift'])) {
                sendError('Name, position, and shift are required');
            }

            $name = trim($input['name']);
            $position = trim($input['position']);
            $shift = $input['shift'];
            $role = $input['role'] ?? 'employee';
            $password = $input['password'] ?? null;

            if (empty($name) || empty($position) || empty($shift)) {
                sendError('Name, position, and shift cannot be empty');
            }

            if (!in_array($shift, ['صباحي', 'مسائي', 'ليلي'])) {
                sendError('Invalid shift value');
            }

            if (!in_array($role, ['admin', 'employee'])) {
                sendError('Invalid role value');
            }

            // Generate IDs
            $userId = 'user-' . uniqid();
            $employeeId = 'emp-' . uniqid();

            // Hash password if provided
            $hashedPassword = $password ? password_hash($password, PASSWORD_DEFAULT) : password_hash('default123', PASSWORD_DEFAULT);

            // Start transaction
            $pdo->beginTransaction();

            try {
                // Create user account
                $stmt = $pdo->prepare("
                    INSERT INTO users (id, username, password, name, role)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $username = 'user_' . time() . '_' . rand(1000, 9999);
                $stmt->execute([$userId, $username, $hashedPassword, $name, $role]);

                // Create employee record
                $stmt = $pdo->prepare("
                    INSERT INTO employees (id, name, role, position, shift, user_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$employeeId, $name, $role, $position, $shift, $userId]);

                $pdo->commit();

                // Return created employee
                sendJSON([
                    'id' => $employeeId,
                    'name' => $name,
                    'role' => $role,
                    'position' => $position,
                    'shift' => $shift
                ], 201);

            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        case 'PUT':
            // Update employee
            $input = getJSONInput();
            
            if (!isset($input['id'])) {
                sendError('Employee ID is required');
            }

            $employeeId = $input['id'];
            $updates = [];
            $params = [];

            if (isset($input['name'])) {
                $updates[] = "name = ?";
                $params[] = trim($input['name']);
            }

            if (isset($input['position'])) {
                $updates[] = "position = ?";
                $params[] = trim($input['position']);
            }

            if (isset($input['shift'])) {
                if (!in_array($input['shift'], ['صباحي', 'مسائي', 'ليلي'])) {
                    sendError('Invalid shift value');
                }
                $updates[] = "shift = ?";
                $params[] = $input['shift'];
            }

            if (isset($input['role'])) {
                if (!in_array($input['role'], ['admin', 'employee'])) {
                    sendError('Invalid role value');
                }
                $updates[] = "role = ?";
                $params[] = $input['role'];
            }

            if (empty($updates)) {
                sendError('No fields to update');
            }

            $params[] = $employeeId;

            $sql = "UPDATE employees SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Update user role if changed
            if (isset($input['role'])) {
                $stmt = $pdo->prepare("
                    UPDATE users u
                    INNER JOIN employees e ON u.id = e.user_id
                    SET u.role = ?
                    WHERE e.id = ?
                ");
                $stmt->execute([$input['role'], $employeeId]);
            }

            // Update password if provided
            if (isset($input['password']) && !empty($input['password'])) {
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("
                    UPDATE users u
                    INNER JOIN employees e ON u.id = e.user_id
                    SET u.password = ?
                    WHERE e.id = ?
                ");
                $stmt->execute([$hashedPassword, $employeeId]);
            }

            // Get updated employee
            $stmt = $pdo->prepare("
                SELECT id, name, role, position, shift
                FROM employees
                WHERE id = ?
            ");
            $stmt->execute([$employeeId]);
            $employee = $stmt->fetch();

            if (!$employee) {
                sendError('Employee not found', 404);
            }

            sendJSON([
                'id' => $employee['id'],
                'name' => $employee['name'],
                'role' => $employee['role'],
                'position' => $employee['position'],
                'shift' => $employee['shift']
            ]);
            break;

        default:
            sendError('Method not allowed', 405);
    }

} catch (PDOException $e) {
    error_log("Employees API error: " . $e->getMessage());
    sendError('Database error occurred', 500);
} catch (Exception $e) {
    error_log("Employees API error: " . $e->getMessage());
    sendError('An error occurred', 500);
}


