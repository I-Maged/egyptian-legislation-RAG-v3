/**
 * Backwards-compatible entry point.
 *
 * The RAGAS exporter is now law-agnostic. Prefer:
 *
 *   npm run ragas:dataset -- --law labour
 *
 * or set EVALUATION_LAW and run the generic RAGAS dataset command.
 */
import "./export";
