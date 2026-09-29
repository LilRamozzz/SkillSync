-- ============================================================
-- SkillSync — Esquema MySQL
-- ============================================================
-- Motor: InnoDB / Charset: utf8mb4
-- Entidades: universities, users, profiles, knowledge,
--            user_teach_knowledge, user_learn_knowledge,
--            matches, conversations, messages

CREATE DATABASE IF NOT EXISTS skillsync
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE skillsync;

-- Universidades (catálogo, dominio para orientación, NO limitante)
CREATE TABLE IF NOT EXISTS universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  domain VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Usuarios (auth + verificación institucional simulada)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  institutional_email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  university_id INT NULL,
  university_name VARCHAR(150) NOT NULL DEFAULT '',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_code VARCHAR(10) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_university FOREIGN KEY (university_id)
    REFERENCES universities(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(institutional_email);

-- Perfil académico (1:1 con users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY,
  career VARCHAR(120) NOT NULL DEFAULT '',
  semester VARCHAR(40) NOT NULL DEFAULT '',
  bio VARCHAR(500) NOT NULL DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Catálogo de conocimientos
CREATE TABLE IF NOT EXISTS knowledge (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  category VARCHAR(80) NOT NULL DEFAULT 'General'
) ENGINE=InnoDB;

-- Qué puede enseñar cada usuario
CREATE TABLE IF NOT EXISTS user_teach_knowledge (
  user_id INT NOT NULL,
  knowledge_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, knowledge_id),
  CONSTRAINT fk_teach_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_teach_know FOREIGN KEY (knowledge_id)
    REFERENCES knowledge(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Qué quiere aprender cada usuario
CREATE TABLE IF NOT EXISTS user_learn_knowledge (
  user_id INT NOT NULL,
  knowledge_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, knowledge_id),
  CONSTRAINT fk_learn_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_learn_know FOREIGN KEY (knowledge_id)
    REFERENCES knowledge(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Matches persistidos (par ordenado user_low < user_high para unicidad)
CREATE TABLE IF NOT EXISTS matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_a_id INT NOT NULL,
  user_b_id INT NOT NULL,
  compatibility DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_match_pair (user_a_id, user_b_id),
  CONSTRAINT fk_match_a FOREIGN KEY (user_a_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_match_b FOREIGN KEY (user_b_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_match_order CHECK (user_a_id < user_b_id),
  CONSTRAINT chk_match_distinct CHECK (user_a_id <> user_b_id)
) ENGINE=InnoDB;

-- Conversaciones 1:1 entre matches (par ordenado)
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_one_id INT NOT NULL,
  user_two_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conv_pair (user_one_id, user_two_id),
  CONSTRAINT fk_conv_one FOREIGN KEY (user_one_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_conv_two FOREIGN KEY (user_two_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_conv_order CHECK (user_one_id < user_two_id),
  CONSTRAINT chk_conv_distinct CHECK (user_one_id <> user_two_id)
) ENGINE=InnoDB;

-- Mensajes básicos
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id)
    REFERENCES conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_messages_conv ON messages(conversation_id, id);
