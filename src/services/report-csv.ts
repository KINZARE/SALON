import "server-only";
import { stringify } from "csv-stringify/sync";

export function serializeReportCsv(rows: unknown[][]) {
  return stringify(rows, { bom: true, record_delimiter: "\r\n", eof: false, escape_formulas: true, quoted_match: /[\r\n]/ });
}
