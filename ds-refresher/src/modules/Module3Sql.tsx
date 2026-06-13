import { ConceptCard } from '../components/ConceptCard'
import { CodeSnippet } from '../components/CodeSnippet'
import { ModuleIntro, ModuleLayout } from '../components/ModuleLayout'
import { Quiz } from '../components/Quiz'
import { moduleById } from '../lib/modules'
import { sqlQuiz } from '../data/quizzes/sql'
import { JoinVisualizer } from '../viz/JoinVisualizer'
import { QueryPipeline } from '../viz/QueryPipeline'

const mod = moduleById('sql')!

const SECTIONS = [
  { id: 'joins', label: 'Joins' },
  { id: 'pipeline', label: 'Logical query order' },
  { id: 'subqueries', label: 'Subqueries' },
  { id: 'ddl-dml', label: 'DDL vs DML' },
  { id: 'python-sql', label: 'SQL from Python' },
  { id: 'quiz', label: 'Quiz' },
]

const JOIN_CODE = `
SELECT c.name, o.order_id, o.amount
FROM customers AS c
LEFT JOIN orders AS o
  ON c.customer_id = o.customer_id;
`.trim()

const SUBQUERY_CODE = `
SELECT *
FROM products
WHERE price > (
  SELECT AVG(price) FROM products
);
`.trim()

const PYTHON_SQL_CODE = `
import sqlite3
import pandas as pd

conn = sqlite3.connect('shop.db')

query = """
  SELECT city, AVG(amount) AS avg_amount
  FROM orders
  GROUP BY city
  ORDER BY avg_amount DESC
"""
df = pd.read_sql(query, conn)
`.trim()

export default function Module3Sql() {
  return (
    <ModuleLayout module={mod} sections={SECTIONS}>
      <ModuleIntro module={mod}>
        SQL is how data lives before it ever reaches a DataFrame. This module covers the core
        query clauses, how joins combine tables, the order the database engine actually executes
        a query in (which is <em>not</em> the order you write it), and how to pull query results
        straight into pandas.
      </ModuleIntro>

      <ConceptCard
        id="joins"
        title="Joins: combining rows from two tables"
        viz={<JoinVisualizer />}
        code={<CodeSnippet lang="sql" title="join.sql" code={JOIN_CODE} />}
      >
        <p>
          A join matches rows from two tables on a key. <strong>INNER</strong> keeps only matched
          pairs. <strong>LEFT</strong> keeps every row from the left table, filling unmatched
          right-side columns with <code>NULL</code>. <strong>RIGHT</strong> is the mirror image.{' '}
          <strong>FULL OUTER</strong> keeps everything from both sides. The Venn diagram highlights
          which region of "left only / both / right only" each join type returns — try each one
          and watch both the result table and the diagram update together.
        </p>
      </ConceptCard>

      <ConceptCard
        id="pipeline"
        title="The query is written in one order, but runs in another"
        viz={<QueryPipeline />}
      >
        <p>
          You write <code>SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT</code>
          , but the engine evaluates it roughly <code>FROM → WHERE → GROUP BY → HAVING → SELECT →
          ORDER BY → LIMIT</code>. That's why <code>WHERE</code> can't see aggregates (they don't
          exist yet) while <code>HAVING</code> can, and why column aliases from{' '}
          <code>SELECT</code> usually can't be reused in <code>WHERE</code>. Step through the
          pipeline to watch a 10-row orders table get filtered, grouped, filtered again, projected,
          sorted, and trimmed.
        </p>
      </ConceptCard>

      <ConceptCard
        id="subqueries"
        title="Subqueries: a query inside a query"
        code={<CodeSnippet lang="sql" title="subquery.sql" code={SUBQUERY_CODE} defaultOpen />}
      >
        <p>
          A subquery in <code>WHERE</code> is evaluated first and its result (here, a single
          number — the average price) is substituted in before the outer query runs. Subqueries
          can also appear in <code>FROM</code> (as a derived table), in <code>SELECT</code> (as a
          computed column), or with <code>IN</code> / <code>EXISTS</code> to test membership
          against a set of rows rather than a single value.
        </p>
      </ConceptCard>

      <ConceptCard id="ddl-dml" title="DDL vs DML at a glance">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ink-700 bg-ink-900 p-4">
            <h3 className="accent-text font-mono text-sm font-semibold">DDL — Data Definition</h3>
            <p className="mt-1 text-sm text-ink-300">Defines or changes the structure of objects.</p>
            <ul className="mt-3 space-y-1 font-mono text-xs text-ink-100">
              <li><span className="text-good">CREATE</span> TABLE / INDEX / VIEW</li>
              <li><span className="text-warn">ALTER</span> TABLE ... ADD COLUMN</li>
              <li><span className="text-bad">DROP</span> TABLE / INDEX</li>
            </ul>
          </div>
          <div className="rounded-lg border border-ink-700 bg-ink-900 p-4">
            <h3 className="accent-text font-mono text-sm font-semibold">DML — Data Manipulation</h3>
            <p className="mt-1 text-sm text-ink-300">Reads and writes the data inside that structure.</p>
            <ul className="mt-3 space-y-1 font-mono text-xs text-ink-100">
              <li><span className="text-good">SELECT</span> ... FROM ...</li>
              <li><span className="text-good">INSERT</span> INTO ... VALUES ...</li>
              <li><span className="text-warn">UPDATE</span> ... SET ... WHERE ...</li>
              <li><span className="text-bad">DELETE</span> FROM ... WHERE ...</li>
            </ul>
          </div>
        </div>
        <p className="mt-3">
          Rule of thumb: DDL changes <em>what exists</em> (tables, columns, indexes); DML changes
          or reads <em>the rows inside</em> what already exists. <code>DROP TABLE</code> removes
          the table and its data; <code>DELETE FROM table</code> empties the rows but keeps the
          (now-empty) table.
        </p>
      </ConceptCard>

      <ConceptCard
        id="python-sql"
        title="Querying SQL from Python"
        code={<CodeSnippet lang="python" title="read_sql.py" code={PYTHON_SQL_CODE} defaultOpen />}
      >
        <p>
          <code>sqlite3.connect(...)</code> (or a SQLAlchemy <code>create_engine(...)</code> for
          Postgres/MySQL) gives you a connection object. Pass any SQL string and that connection to{' '}
          <code>pd.read_sql(query, conn)</code> and pandas runs the query and returns the result
          set as a DataFrame — column names and types inferred from the query result, ready for{' '}
          <code>.groupby</code>, plotting, or further analysis.
        </p>
      </ConceptCard>

      <ConceptCard id="quiz" title="Check yourself">
        <Quiz moduleId="sql" questions={sqlQuiz} />
      </ConceptCard>
    </ModuleLayout>
  )
}
