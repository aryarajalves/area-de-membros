# 📚 Documentação Oficial de APIs da Plataforma

> Mapeamento completo e atualizado de todos os endpoints REST da **Área de Membros**.

**Total de endpoints catalogados:** 78 rotas.

## 🛡️ Legenda de Níveis de Acesso e Autorização
- 🌐 **Público:** Não requer autenticação. Aberto para login, cadastro via convite e entrega de arquivos públicos.
- 🔑 **Autenticado (Aluno / Admin):** Requer cabeçalho `Authorization: Bearer <token_jwt>`. Acessível por qualquer usuário logado.
- 👑 **SuperAdmin (Manager):** Requer token JWT de usuário administrador (`role: superadmin`). Alunos comuns recebem `403 Forbidden`.

---

## 1. Autenticação, Usuários e Convites (17 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1/auth/invites` | 🔑 Autenticado (Aluno / Admin) | Criar Convite de Acesso |
| **`GET`** | `/api/v1/auth/invites` | 🔑 Autenticado (Aluno / Admin) | Listar Convites de Acesso |
| **`POST`** | `/api/v1/auth/invites/bulk-delete` | 🔑 Autenticado (Aluno / Admin) | Excluir Convites em Lote |
| **`GET`** | `/api/v1/auth/invites/validate` | 🔑 Autenticado (Aluno / Admin) | Validar Token de Convite |
| **`DELETE`** | `/api/v1/auth/invites/{invite_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Convite |
| **`POST`** | `/api/v1/auth/login` | 🌐 Público | Realizar Login de Usuário |
| **`GET`** | `/api/v1/auth/me` | 🔑 Autenticado (Aluno / Admin) | Obter Perfil do Usuário Logado |
| **`POST`** | `/api/v1/auth/register` | 🌐 Público | Iniciar Cadastro com Convite |
| **`POST`** | `/api/v1/auth/register/resend-code` | 🌐 Público | Reenviar Código OTP de Cadastro |
| **`POST`** | `/api/v1/auth/register/verify` | 🌐 Público | Confirmar Código OTP e Criar Conta |
| **`POST`** | `/api/v1/auth/reset-password/confirm` | 🌐 Público | Confirmar Nova Senha com Token |
| **`GET`** | `/api/v1/auth/reset-password/validate` | 🌐 Público | Validar Token de Redefinição de Senha |
| **`GET`** | `/api/v1/auth/users` | 🔑 Autenticado (Aluno / Admin) | Listar Todos os Usuários |
| **`POST`** | `/api/v1/auth/users/bulk-delete` | 🔑 Autenticado (Aluno / Admin) | Excluir Usuários em Lote |
| **`PATCH`** | `/api/v1/auth/users/{user_id}` | 🔑 Autenticado (Aluno / Admin) | Update User |
| **`DELETE`** | `/api/v1/auth/users/{user_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Usuário |
| **`POST`** | `/api/v1/auth/users/{user_id}/reset-password-request` | 🔑 Autenticado (Aluno / Admin) | Gerar Link de Redefinição de Senha |

## 2. Gestão de Cursos e Módulos (9 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/courses` | 🔑 Autenticado (Aluno / Admin) | Listar Cursos |
| **`POST`** | `/api/v1/courses` | 👑 SuperAdmin (Manager) | Criar Novo Curso |
| **`GET`** | `/api/v1/courses/{course_id}` | 🔑 Autenticado (Aluno / Admin) | Obter Detalhes do Curso |
| **`PATCH`** | `/api/v1/courses/{course_id}` | 🔑 Autenticado (Aluno / Admin) | Atualizar Curso |
| **`DELETE`** | `/api/v1/courses/{course_id}` | 👑 SuperAdmin (Manager) | Excluir Curso |
| **`GET`** | `/api/v1/courses/{course_id}/modules` | 🔑 Autenticado (Aluno / Admin) | Listar Módulos do Curso |
| **`POST`** | `/api/v1/courses/{course_id}/modules` | 👑 SuperAdmin (Manager) | Criar Módulo no Curso |
| **`PATCH`** | `/api/v1/courses/{course_id}/modules/{module_id}` | 🔑 Autenticado (Aluno / Admin) | Atualizar Módulo |
| **`DELETE`** | `/api/v1/courses/{course_id}/modules/{module_id}` | 👑 SuperAdmin (Manager) | Excluir Módulo |

## 3. Aulas, Vídeos, Conteúdo de Texto e Anexos (7 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/v1/courses/upload-attachment` | 👑 SuperAdmin (Manager) | Upload de Material Complementar |
| **`POST`** | `/api/v1/courses/upload-video` | 👑 SuperAdmin (Manager) | Upload de Vídeo de Aula |
| **`POST`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons` | 👑 SuperAdmin (Manager) | Criar Aula no Módulo |
| **`PATCH`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}` | 🔑 Autenticado (Aluno / Admin) | Atualizar Aula |
| **`DELETE`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}` | 👑 SuperAdmin (Manager) | Excluir Aula |
| **`POST`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/attachments` | 👑 SuperAdmin (Manager) | Adicionar Anexo na Aula |
| **`DELETE`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/attachments/{attachment_id}` | 👑 SuperAdmin (Manager) | Excluir Anexo da Aula |

## 4. Quizzes e Avaliações Interativas (3 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/quiz` | 🔑 Autenticado (Aluno / Admin) | Obter Perguntas e Quiz da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/quiz` | 👑 SuperAdmin (Manager) | Cadastrar/Atualizar Quiz da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/quiz/submit` | 🔑 Autenticado (Aluno / Admin) | Submeter Respostas do Quiz (Aluno) |

## 5. Interações do Aluno (Comentários, Avaliações, Notas e Progresso) (16 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/courses/reports` | 👑 SuperAdmin (Manager) | Listar Problemas Reportados |
| **`GET`** | `/api/v1/courses/reports/summary` | 👑 SuperAdmin (Manager) | Resumo de Relatórios de Problemas |
| **`PATCH`** | `/api/v1/courses/reports/{report_id}` | 👑 SuperAdmin (Manager) | Atualizar Status do Relato de Problema |
| **`DELETE`** | `/api/v1/courses/reports/{report_id}` | 👑 SuperAdmin (Manager) | Excluir Relato de Problema |
| **`GET`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/notes` | 🔑 Autenticado (Aluno / Admin) | Listar Anotações Pessoais da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/notes` | 🔑 Autenticado (Aluno / Admin) | Criar Anotação Pessoal na Aula |
| **`PUT`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/notes/{note_id}` | 🔑 Autenticado (Aluno / Admin) | Atualizar Anotação Pessoal da Aula |
| **`DELETE`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/notes/{note_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Anotação Pessoal da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/progress` | 🔑 Autenticado (Aluno / Admin) | Marcar/Desmarcar Aula Concluída |
| **`GET`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/rating` | 🔑 Autenticado (Aluno / Admin) | Obter Avaliação da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/rating` | 🔑 Autenticado (Aluno / Admin) | Avaliar Aula com Estrelas |
| **`POST`** | `/api/v1/courses/{course_id}/lessons/{lesson_id}/reports` | 🔑 Autenticado (Aluno / Admin) | Denunciar/Reportar Problema na Aula |
| **`GET`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments` | 🔑 Autenticado (Aluno / Admin) | Listar Comentários da Aula |
| **`POST`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments` | 🔑 Autenticado (Aluno / Admin) | Criar Comentário ou Resposta |
| **`DELETE`** | `/api/v1/courses/{course_id}/modules/{module_id}/lessons/{lesson_id}/comments/{comment_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Comentário da Aula |
| **`GET`** | `/api/v1/courses/{course_id}/progress` | 🔑 Autenticado (Aluno / Admin) | Obter Progresso Geral do Curso |

## 6. Gestão de Alunos e Matrículas (5 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/students` | 🔑 Autenticado (Aluno / Admin) | Listar Alunos e Métricas |
| **`GET`** | `/api/v1/students/export` | 🔑 Autenticado (Aluno / Admin) | Exportar Alunos (CSV/XLSX) |
| **`POST`** | `/api/v1/students/import` | 👑 SuperAdmin (Manager) | Importar Alunos em Lote |
| **`GET`** | `/api/v1/students/import/template` | 👑 SuperAdmin (Manager) | Baixar Modelo de Planilha para Importação |
| **`GET`** | `/api/v1/students/{student_id}/courses/{course_id}/history` | 🔑 Autenticado (Aluno / Admin) | Histórico Detalhado do Aluno no Curso |

## 7. Suporte e Dúvidas da Comunidade (9 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/support/my-courses` | 🔑 Autenticado (Aluno / Admin) | Listar Cursos Permitidos para Dúvidas |
| **`GET`** | `/api/v1/support/topics` | 🔑 Autenticado (Aluno / Admin) | Listar Dúvidas da Comunidade |
| **`POST`** | `/api/v1/support/topics` | 🔑 Autenticado (Aluno / Admin) | Publicar Nova Dúvida |
| **`GET`** | `/api/v1/support/topics/{topic_id}` | 🔑 Autenticado (Aluno / Admin) | Obter Detalhes da Dúvida |
| **`DELETE`** | `/api/v1/support/topics/{topic_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Dúvida |
| **`POST`** | `/api/v1/support/topics/{topic_id}/like` | 🔑 Autenticado (Aluno / Admin) | Curtir/Descurtir Dúvida |
| **`POST`** | `/api/v1/support/topics/{topic_id}/replies` | 🔑 Autenticado (Aluno / Admin) | Responder a uma Dúvida |
| **`DELETE`** | `/api/v1/support/topics/{topic_id}/replies/{reply_id}` | 🔑 Autenticado (Aluno / Admin) | Excluir Resposta de Dúvida |
| **`POST`** | `/api/v1/support/upload-image` | 🔑 Autenticado (Aluno / Admin) | Upload de Imagem para Suporte |

## 8. Webhooks e Integrações Externas (8 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/integrations` | 👑 SuperAdmin (Manager) | Listar Webhooks Cadastrados |
| **`POST`** | `/api/v1/integrations` | 👑 SuperAdmin (Manager) | Cadastrar Novo Webhook |
| **`POST`** | `/api/v1/integrations/check-renewals` | 👑 SuperAdmin (Manager) | Verificação Manual de Renovações |
| **`GET`** | `/api/v1/integrations/{id}` | 👑 SuperAdmin (Manager) | Obter Detalhes do Webhook |
| **`PUT`** | `/api/v1/integrations/{id}` | 👑 SuperAdmin (Manager) | Atualizar Configurações do Webhook |
| **`DELETE`** | `/api/v1/integrations/{id}` | 👑 SuperAdmin (Manager) | Excluir Webhook |
| **`GET`** | `/api/v1/integrations/{id}/logs` | 👑 SuperAdmin (Manager) | Listar Histórico de Disparos |
| **`POST`** | `/api/v1/integrations/{id}/test` | 👑 SuperAdmin (Manager) | Testar Disparo do Webhook |

## 11. Plataforma e Configurações Globais (4 rotas)

| Método | Endpoint | Nível de Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/v1/courses/platform-theme` | 👑 SuperAdmin (Manager) | Obter Tema Global da Plataforma |
| **`PATCH`** | `/api/v1/courses/platform-theme` | 👑 SuperAdmin (Manager) | Atualizar Tema Global da Plataforma |
| **`POST`** | `/api/v1/courses/upload-thumbnail` | 👑 SuperAdmin (Manager) | Upload de Capa/Thumbnail do Curso |
| **`GET`** | `/health` | 🌐 Público | Status e Saúde da API |
