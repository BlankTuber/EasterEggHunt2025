<?php
class Database {
    private $host = DB_HOST;
    private $user = DB_USER;
    private $pass = DB_PASS;
    private $dbname = DB_NAME;
    
    private $conn;
    private $stmt;
    private static $instance = null;
    
    // Use Singleton pattern for database connection
    private function __construct() {
        // Set DSN
        $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->dbname . ';charset=utf8mb4';
        
        // Set options
        $options = array(
            PDO::ATTR_PERSISTENT => true,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        );
        
        // Create PDO instance
        try {
            $this->conn = new PDO($dsn, $this->user, $this->pass, $options);
        } catch(PDOException $e) {
            error_log('Database Connection Error: ' . $e->getMessage());
            throw new Exception('Database connection failed. Please try again later.');
        }
    }
    
    // Get instance of the Database object
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    // Prepare statement with query
    public function query($sql) {
        $this->stmt = $this->conn->prepare($sql);
        return $this;
    }
    
    // Bind values
    public function bind($param, $value, $type = null) {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        
        $this->stmt->bindValue($param, $value, $type);
        return $this;
    }
    
    // Execute the prepared statement
    public function execute() {
        try {
            return $this->stmt->execute();
        } catch(PDOException $e) {
            error_log('Database Query Error: ' . $e->getMessage() . ' - SQL: ' . $this->stmt->queryString);
            throw new Exception('Database query failed. Please try again later.');
        }
    }
    
    // Get result set as array of objects
    public function resultSet() {
        $this->execute();
        return $this->stmt->fetchAll();
    }
    
    // Get single record as object
    public function single() {
        $this->execute();
        return $this->stmt->fetch();
    }
    
    // Get row count
    public function rowCount() {
        return $this->stmt->rowCount();
    }
    
    // Get last insert ID
    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }
    
    // Begin transaction
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    // End transaction
    public function endTransaction() {
        return $this->conn->commit();
    }
    
    // Cancel transaction
    public function cancelTransaction() {
        return $this->conn->rollBack();
    }
}