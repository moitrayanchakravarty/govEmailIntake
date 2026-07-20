import styles from './dataTable.module.css';

/**
 * Generic responsive table. On narrow screens, rows collapse into
 * label:value stacks via the `data-label` attribute + CSS, rather than
 * introducing horizontal scroll on a form-heavy government site.
 */
export default function DataTable({ columns, rows, rowKey, emptyMessage = 'No records found.', caption }) {
  if (!rows.length) {
    return <p className={styles.empty}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.header}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
