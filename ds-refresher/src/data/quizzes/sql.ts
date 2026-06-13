import type { QuizQuestion } from './types'

export const sqlQuiz: QuizQuestion[] = [
  {
    id: 'm3-q1',
    prompt: 'In SQL, what is the logical (execution) order of these clauses?',
    options: [
      'FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT',
      'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT',
      'FROM, SELECT, WHERE, GROUP BY, ORDER BY, HAVING, LIMIT',
      'WHERE, FROM, SELECT, GROUP BY, HAVING, ORDER BY, LIMIT',
    ],
    correctIndex: 0,
    explanation:
      'Even though SELECT is written first, the engine conceptually loads rows (FROM), filters them (WHERE), groups (GROUP BY), filters groups (HAVING), projects columns (SELECT), sorts (ORDER BY), then trims (LIMIT).',
  },
  {
    id: 'm3-q2',
    prompt: 'Why can\'t WHERE reference an aggregate like AVG(amount), but HAVING can?',
    options: [
      'WHERE runs before GROUP BY/aggregation happens, so aggregates do not exist yet; HAVING runs after, on groups',
      'WHERE is for strings only, HAVING is for numbers only',
      'It is an arbitrary syntax restriction with no underlying reason',
      'WHERE can reference aggregates too, but HAVING cannot',
    ],
    correctIndex: 0,
    explanation:
      'WHERE filters individual rows before grouping, so per-group aggregates are not yet computed. HAVING runs after GROUP BY, once aggregates exist, so it can filter on them.',
  },
  {
    id: 'm3-q3',
    prompt: 'An INNER JOIN between customers and orders on customer_id returns which rows?',
    options: [
      'Only rows where a customer_id exists in both tables',
      'All customers, with NULLs for those without orders',
      'All orders, with NULLs for those without a matching customer',
      'Every possible combination of customers and orders (cartesian product)',
    ],
    correctIndex: 0,
    explanation:
      'INNER JOIN keeps only the intersection — rows where the join key matches on both sides. Customers with no orders, and orders with no matching customer, are excluded.',
  },
  {
    id: 'm3-q4',
    prompt: 'A LEFT JOIN from customers to orders returns a customer with no orders. What appears in the order columns for that row?',
    options: ['NULL', '0', 'An empty string', 'The row is excluded'],
    correctIndex: 0,
    explanation:
      'LEFT JOIN keeps every row from the left table (customers) regardless of a match; columns from the unmatched right table (orders) are filled with NULL.',
  },
  {
    id: 'm3-q5',
    prompt: 'Which JOIN type returns the union of both tables — all matched rows plus unmatched rows from either side, with NULLs filling the gaps?',
    options: ['FULL OUTER JOIN', 'INNER JOIN', 'LEFT JOIN', 'CROSS JOIN'],
    correctIndex: 0,
    explanation:
      'FULL OUTER JOIN combines LEFT and RIGHT JOIN behavior: every row from both tables appears at least once, with NULLs where there is no match on the other side.',
  },
  {
    id: 'm3-q6',
    prompt: 'What does this subquery do? SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products)',
    options: [
      'Returns products priced above the average price across all products',
      'Returns the average price as a single row',
      'Returns products priced below the average price',
      'Returns an error because subqueries cannot appear in WHERE',
    ],
    correctIndex: 0,
    explanation:
      'The inner query computes a single scalar value (the average price), and the outer query filters rows where price exceeds that value — a classic scalar subquery in WHERE.',
  },
  {
    id: 'm3-q7',
    prompt: 'Which of these is DDL (Data Definition Language) rather than DML (Data Manipulation Language)?',
    options: ['ALTER TABLE', 'INSERT', 'UPDATE', 'DELETE'],
    correctIndex: 0,
    explanation:
      'DDL statements (CREATE, ALTER, DROP) define or change the structure of database objects. DML statements (SELECT, INSERT, UPDATE, DELETE) manipulate the data within that structure.',
  },
  {
    id: 'm3-q8',
    prompt: 'In Python, what does pd.read_sql(query, conn) do?',
    options: [
      'Executes the SQL query against the connection and returns the result as a DataFrame',
      'Writes a DataFrame to a SQL table',
      'Opens a new database connection',
      'Validates the SQL syntax without running it',
    ],
    correctIndex: 0,
    explanation:
      'pd.read_sql() runs the given query (or table name) using the provided connection (e.g. from sqlite3.connect or a SQLAlchemy engine) and loads the results directly into a DataFrame.',
  },
  {
    id: 'm3-q9',
    prompt: 'GROUP BY city followed by HAVING AVG(amount) > 30 does what?',
    options: [
      'Groups rows by city, computes AVG(amount) per group, then keeps only groups whose average exceeds 30',
      'Filters individual rows where amount > 30, then groups the rest by city',
      'Removes the city column from the result',
      'Sorts cities alphabetically by their average amount',
    ],
    correctIndex: 0,
    explanation:
      'GROUP BY collapses rows into one group per city; HAVING then filters those groups based on the aggregate AVG(amount), discarding groups with a low average.',
  },
  {
    id: 'm3-q10',
    prompt: 'A query has ORDER BY avg_amount DESC LIMIT 2. If executed in logical order, when does LIMIT take effect relative to ORDER BY?',
    options: [
      'After ORDER BY — the rows are sorted first, then the top 2 of the sorted result are kept',
      'Before ORDER BY — 2 rows are picked first, then sorted',
      'LIMIT and ORDER BY happen simultaneously and order does not matter',
      'LIMIT is applied to the raw table before any other clause',
    ],
    correctIndex: 0,
    explanation:
      'LIMIT is the very last logical step: it operates on the already-sorted (and already-selected, grouped, filtered) result set, simply truncating it to the requested number of rows.',
  },
]
