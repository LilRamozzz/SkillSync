-- ============================================================
-- SkillSync — Datos de prueba (TODO ficticio)
-- Clave demo de todos los usuarios: Password123
-- Hash bcryptjs de "Password123" (cost 10):
-- $2a$10$wOxOY straw placeholder — se reemplaza al ejecutar seed.js
-- NOTA: este archivo usa hashes reales generados por backend/seed.
-- Si lo importas manualmente, las contraseñas deben generarse con bcrypt.
-- ============================================================
USE skillsync;

-- Universidades
INSERT INTO universities (name, domain) VALUES
  ('Universidad Tecnológica del Perú (UTP)', 'utp.edu.pe'),
  ('Universidad Nacional Mayor de San Marcos', 'unmsm.edu.pe'),
  ('Pontificia Universidad Católica del Perú', 'pucp.edu.pe'),
  ('Universidad Peruana de Ciencias Aplicadas', 'upc.edu.pe')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Conocimientos base
INSERT INTO knowledge (name, category) VALUES
  ('Java', 'Programación'),
  ('Git', 'Herramientas'),
  ('HTML', 'Programación Web'),
  ('CSS', 'Programación Web'),
  ('Programación Web', 'Programación Web'),
  ('Estadística', 'Matemáticas'),
  ('Excel', 'Ofimática'),
  ('Python', 'Programación'),
  ('Machine Learning', 'IA/Datos'),
  ('Redes', 'Infraestructura'),
  ('Packet Tracer', 'Infraestructura')
ON DUPLICATE KEY UPDATE category = VALUES(category);

-- Usuarios demo (password_hash se actualiza con seed del backend;
-- aquí se deja un marcador que el script backend reemplaza).
-- Para importación manual rápida, genera hashes con:
--   node -e "console.log(require('bcryptjs').hashSync('Password123',10))"
INSERT INTO users
  (first_name, last_name, institutional_email, password_hash, university_name, is_verified)
VALUES
  ('Leonardo', 'Ramos', 'leonardo.ramos@utp.edu.pe', '$2a$10$REEMPLAZAR_POR_HASH_REAL', 'Universidad Tecnológica del Perú (UTP)', 1),
  ('Carlos', 'Mendoza', 'carlos.mendoza@unmsm.edu.pe', '$2a$10$REEMPLAZAR_POR_HASH_REAL', 'Universidad Nacional Mayor de San Marcos', 1),
  ('Andrea', 'Torres', 'andrea.torres@pucp.edu.pe', '$2a$10$REEMPLAZAR_POR_HASH_REAL', 'Pontificia Universidad Católica del Perú', 1),
  ('Miguel', 'Quispe', 'miguel.quispe@upc.edu.pe', '$2a$10$REEMPLAZAR_POR_HASH_REAL', 'Universidad Peruana de Ciencias Aplicadas', 1)
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- Perfiles (ids asumidos 1-4 en BD limpia; si ya existen, ajustar)
-- Se hace resistente con variables por email:
SET @u_leo    := (SELECT id FROM users WHERE institutional_email = 'leonardo.ramos@utp.edu.pe');
SET @u_carlos := (SELECT id FROM users WHERE institutional_email = 'carlos.mendoza@unmsm.edu.pe');
SET @u_andrea := (SELECT id FROM users WHERE institutional_email = 'andrea.torres@pucp.edu.pe');
SET @u_miguel := (SELECT id FROM users WHERE institutional_email = 'miguel.quispe@upc.edu.pe');

INSERT INTO profiles (user_id, career, semester, bio) VALUES
  (@u_leo, 'Ingeniería Informática', '5to ciclo', 'Me gusta el desarrollo web y compartir lo que aprendo. Busco reforzar mi base de estadística.'),
  (@u_carlos, 'Ingeniería de Sistemas', '4to ciclo', 'Disfruto los números y Excel. Quiero aprender Java para mis cursos de programación.'),
  (@u_andrea, 'Ciencia de la Computación', '6to ciclo', 'Trabajo con Python y ML. Quiero dominar Git para colaborar mejor.'),
  (@u_miguel, 'Ingeniería de Redes', '3er ciclo', 'Apasionado por redes con Packet Tracer. Quiero aprender programación web.')
ON DUPLICATE KEY UPDATE career = VALUES(career), semester = VALUES(semester), bio = VALUES(bio);

SET @k_java := (SELECT id FROM knowledge WHERE name = 'Java');
SET @k_git := (SELECT id FROM knowledge WHERE name = 'Git');
SET @k_html := (SELECT id FROM knowledge WHERE name = 'HTML');
SET @k_est := (SELECT id FROM knowledge WHERE name = 'Estadística');
SET @k_excel := (SELECT id FROM knowledge WHERE name = 'Excel');
SET @k_py := (SELECT id FROM knowledge WHERE name = 'Python');
SET @k_ml := (SELECT id FROM knowledge WHERE name = 'Machine Learning');
SET @k_redes := (SELECT id FROM knowledge WHERE name = 'Redes');
SET @k_pt := (SELECT id FROM knowledge WHERE name = 'Packet Tracer');
SET @k_web := (SELECT id FROM knowledge WHERE name = 'Programación Web');

-- Leonardo: enseña Java, Git, HTML / aprende Estadística
INSERT IGNORE INTO user_teach_knowledge (user_id, knowledge_id) VALUES
  (@u_leo, @k_java), (@u_leo, @k_git), (@u_leo, @k_html);
INSERT IGNORE INTO user_learn_knowledge (user_id, knowledge_id) VALUES
  (@u_leo, @k_est);

-- Carlos: enseña Estadística, Excel / aprende Java
INSERT IGNORE INTO user_teach_knowledge (user_id, knowledge_id) VALUES
  (@u_carlos, @k_est), (@u_carlos, @k_excel);
INSERT IGNORE INTO user_learn_knowledge (user_id, knowledge_id) VALUES
  (@u_carlos, @k_java);

-- Andrea: enseña Python, ML / aprende Git
INSERT IGNORE INTO user_teach_knowledge (user_id, knowledge_id) VALUES
  (@u_andrea, @k_py), (@u_andrea, @k_ml);
INSERT IGNORE INTO user_learn_knowledge (user_id, knowledge_id) VALUES
  (@u_andrea, @k_git);

-- Miguel: enseña Redes, Packet Tracer / aprende Programación Web
INSERT IGNORE INTO user_teach_knowledge (user_id, knowledge_id) VALUES
  (@u_miguel, @k_redes), (@u_miguel, @k_pt);
INSERT IGNORE INTO user_learn_knowledge (user_id, knowledge_id) VALUES
  (@u_miguel, @k_web);

-- Conversación de ejemplo Leonardo <-> Carlos
SET @low_lc  := LEAST(@u_leo, @u_carlos);
SET @high_lc := GREATEST(@u_leo, @u_carlos);
INSERT IGNORE INTO conversations (user_one_id, user_two_id) VALUES (@low_lc, @high_lc);
SET @conv_lc := (SELECT id FROM conversations WHERE user_one_id = @low_lc AND user_two_id = @high_lc);

INSERT INTO messages (conversation_id, sender_id, body) VALUES
  (@conv_lc, @u_carlos, 'Hola, vi que sabes Java.'),
  (@conv_lc, @u_leo, 'Sí, puedo ayudarte con Java.'),
  (@conv_lc, @u_carlos, 'Genial, yo puedo ayudarte con Estadística.');
