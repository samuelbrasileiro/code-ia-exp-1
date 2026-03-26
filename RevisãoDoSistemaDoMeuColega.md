# Revisão do Sistema

Responsável pela revisão: Samuel Brasileiro dos Santos Neto  
Responsável pelo sistema: Alisson Gabriel Assunção de Oliveira
Repositório: https://github.com/Alisson-1/automated-test-generator  

## 1) O sistema está funcionando com as funcionalidades solicitadas?
Sim, i sistema cobre as funcionalidades requisitadas: CRUD de questões e provas, geração de provas individuais com PDF + gabarito CSV, e correção com modos mais e menos rigoroso.
- Gerenciamento de questões
    É possível criar, listar, editar e remover questões e alternativas com as validações básicas. Apesar disso, o sistema exige exatamente uma alternativa correta por questão, enquanto o enunciado permite múltiplas corretas. Isso impacta o modo de potências de 2.
- Gerenciamento de provas
    Também possui um CRUD completo de gerência de provas, selecionar as questões e escolher o modo (letras ou potências de 2).
- Geração de PDFs
    Funciona bem. Os pdfs tem as questões embaralhadas e tem o rodapé como esperado, além do gabarito CSV.
- Correção de provas
    O sistema aceita o CSV de gabarito e o CSV de respostas e gera o relatório de notas nos modos “strict” e “lenient” (menos rigorosa). Apesar de que a presença do modo lenient não faça muito sentido desde que é só pode ter uma alternativa correta.

## 2) Problemas de qualidade do código e dos testes
1. O serviço de questões valida exatamente uma correta, mas o próprio teste de aceitação define “ao menos uma correta”. Isso causa divergência entre requisitos, testes e implementação. (manage_questions.feature)
2. A nota "lenient" (menos rigorosa) não faz muito sentido por causa da implemetação de apenas aceitar uma questão

## 3) Como a funcionalidade e a qualidade desse sistema pode ser comparada com as do seu sistema?
Os dois projetos cobrem o fluxo principal de criação de questões, provas, geração de PDFs e correção. A diferença mais relevante, além da interface, é que o meu sistema permite múltiplas alternativas corretas, enquanto o do Alisson restringe a exatamente uma correta. 

Além disso, a ferramenta de Alisson apresenta a geração de PDFs em um botão na tela de provas, o que achei mais interessante do que criar uma página exclusiva para a geração, como fiz. Na geração de PDFs, meu projeto gera um ZIP com várias provas e gabaritos, enquanto Alisson adiciona todos os itens separadamente.


# Revisão do histórico de desenvolvimento de Alisson
- Estratégias de interação utilizada:
    1. Utilizou skills, um ponto bem positivo.
    2. Seguiu em prompts incrementais por módulo, primeiro backend, depois frontend e por fim os testes. Estratégias de interação: prompts incrementais por módulo (backend → frontend → testes).
    3. Utilizou mardown file CLAUDE.md para facilitar o contexto e o agente não alucinar tanto.
- Situações em que o agente funcionou melhor: 
    1. Criação de estrutura inicial
    2. CRUDs
    3. testes de aceitação
    4. implementação de módulos repetitivos
- Situações em que funcionou pior:
    1. geração inicial de PDF (loop e erro de stack)
    2. criação de estrutura com módulos não instalados
    3. descumprimento do padrão de separação lógica/UI em alguns componentes
- Tipos de problemas observados:
    1. vazamento de contexto e excesso de escopo
    2. nomes de variáveis pouco descritivos, regras arquiteturais ignoradas em alguns componentes
    3. erros de build por dependências indevidas
    4. importou módulos sem instalar, adicionou código comentado.
- Avaliação geral da utilidade do agente:
    O agente foi útil para acelerar estrutura e testes, e exigiu supervisão para aderência às regras e correções de bugs. A utilização do arquivo de CLAUDE.md como guia foi ótimo para alinhar os requisitos, o que pretendo fazer no futuro.
- Comparação com minha experiência: 
    Eu utilizei o método de plan para desenvolver a aplicação logo, enquanto Alisson foi de um modo mais incremental. Tive que usar muitos steps depois disso para alinhar os requisitos à aplicação, eu poderia ter ajustado melhor na hora do planejamento ou ido de forma mais incremental para evitar alucinação do agente e fazer módulos mais focados, como Alisson fez. No fim, comparando ao meu uso, essa experiência parece semelhante no ganho de velocidade em tarefas repetitivas, mas necessidade de revisão para manter qualidade e conformidade com requisitos.
