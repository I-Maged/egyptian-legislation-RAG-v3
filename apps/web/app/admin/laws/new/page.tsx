import { createLaw } from "@/app/admin/laws/actions";

export default function NewLawPage() {
  return (
    <main className="admin-main">
      <h1>Add Law</h1>

      <form action={createLaw} className="law-form law-form--new">
        <label>
          Law name
          <input name="lawName" required className="form-input" />
        </label>

        <label>
          Law number
          <input name="lawNumber" className="form-input" />
        </label>

        <label>
          Year
          <input name="year" className="form-input" />
        </label>

        <label>
          Source file
          <input
            name="sourceFile"
            required
            placeholder="labour-law-148-2019.pdf"
            className="form-input"
          />
        </label>

        <label>
          Articles
          <textarea
            name="articles"
            required
            rows={20}
            placeholder={`المادة 1: نص المادة...

المادة 2: نص المادة...

المادة 3: نص المادة...`}
            className="form-textarea"
          />
        </label>

        <button type="submit">Create law</button>
      </form>
    </main>
  );
}
