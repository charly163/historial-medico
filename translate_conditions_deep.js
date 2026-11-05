const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let count = 0;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      count++;
    }
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath} (${count} replacements)`);
}

// 1. ConditionFormDialog.jsx
replaceInFile('frontend/src/components/conditions/ConditionFormDialog.jsx', [
  [
    `const CATEGORIES = [
  'Cardiovascular', 'Respiratory', 'Neurological', 'Gastrointestinal', 'Endocrine', 'Musculoskeletal',
  'Dermatological', 'Psychiatric', 'Infectious Disease', 'Oncological', 'Hematological', 'Renal',
  'Ophthalmological', 'ENT', 'Gynecological', 'Pediatric', 'Emergency', 'Other',
]`,
    `export const CONDITION_CATEGORIES = [
  { value: 'Cardiovascular', label: 'Cardiovascular' },
  { value: 'Respiratory', label: 'Respiratorio' },
  { value: 'Neurological', label: 'Neurológico' },
  { value: 'Gastrointestinal', label: 'Gastrointestinal' },
  { value: 'Endocrine', label: 'Endocrino' },
  { value: 'Musculoskeletal', label: 'Musculoesquelético' },
  { value: 'Dermatological', label: 'Dermatológico' },
  { value: 'Psychiatric', label: 'Psiquiátrico' },
  { value: 'Infectious Disease', label: 'Enfermedad Infecciosa' },
  { value: 'Oncological', label: 'Oncológico' },
  { value: 'Hematological', label: 'Hematológico' },
  { value: 'Renal', label: 'Renal' },
  { value: 'Ophthalmological', label: 'Oftalmológico' },
  { value: 'ENT', label: 'Otorrinolaringología (ORL)' },
  { value: 'Gynecological', label: 'Ginecológico' },
  { value: 'Pediatric', label: 'Pediátrico' },
  { value: 'Emergency', label: 'Urgencia' },
  { value: 'Other', label: 'Otro' },
]

export const SEVERITY_OPTIONS = [
  { value: 'Low', label: 'Baja' },
  { value: 'Medium', label: 'Media' },
  { value: 'High', label: 'Alta' },
]`
  ],
  ['label="ICD-10 code"', 'label="Código CIE-10"'],
  [
    `              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}`,
    `              {CONDITION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}`
  ],
  ['<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>\n            Cancel', '<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>\n            Cancelar'],
  ['<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>\r\n            Cancel', '<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>\r\n            Cancelar']
]);

// 2. Conditions.jsx
replaceInFile('frontend/src/pages/Conditions.jsx', [
  [
    "const { useList, useCreate, useUpdate, useDelete } = createResourceHooks('conditions', '/conditions')",
    `const { useList, useCreate, useUpdate, useDelete } = createResourceHooks('conditions', '/conditions')

export const CATEGORY_LABELS = {
  Cardiovascular: 'Cardiovascular',
  Respiratory: 'Respiratorio',
  Neurological: 'Neurológico',
  Gastrointestinal: 'Gastrointestinal',
  Endocrine: 'Endocrino',
  Musculoskeletal: 'Musculoesquelético',
  Dermatological: 'Dermatológico',
  Psychiatric: 'Psiquiátrico',
  'Infectious Disease': 'Enf. Infecciosa',
  Oncological: 'Oncológico',
  Hematological: 'Hematológico',
  Renal: 'Renal',
  Ophthalmological: 'Oftalmológico',
  ENT: 'ORL',
  Gynecological: 'Ginecológico',
  Pediatric: 'Pediátrico',
  Emergency: 'Urgencia',
  Other: 'Otro',
}

export const SEVERITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  Low: 'Baja',
  Medium: 'Media',
  High: 'Alta',
}

export function translateCategory(cat) {
  return CATEGORY_LABELS[cat] || cat
}

export function translateSeverity(sev) {
  return SEVERITY_LABELS[sev] || sev
}`
  ],
  ["subtitle: 'Medical conditions on file, for diagnoses and history'", "subtitle: 'Condiciones médicas registradas, diagnósticos e historial'"],
  ["placeholder=\"Search by name, description, ICD code, or category…\"", "placeholder=\"Buscar por nombre, descripción, código CIE o categoría…\""],
  [">Clear<", ">Limpiar<"],
  ["{usageCount(c)} usage{usageCount(c) === 1 ? '' : 's'}", "{usageCount(c)} uso{usageCount(c) === 1 ? '' : 's'}"],
  ["{c.category && <Badge>{c.category}</Badge>}", "{c.category && <Badge>{translateCategory(c.category)}</Badge>}"],
  ["{c.severity && <Badge tone={c.severity.toLowerCase()}>{c.severity}</Badge>}", "{c.severity && <Badge tone={c.severity.toLowerCase()}>{translateSeverity(c.severity)}</Badge>}"],
  ['<th className="px-5 py-2.5 font-semibold">Name</th>', '<th className="px-5 py-2.5 font-semibold">Nombre</th>'],
  ['<th className="px-5 py-2.5 font-semibold">ICD code</th>', '<th className="px-5 py-2.5 font-semibold">Código CIE-10</th>'],
  ['<th className="px-5 py-2.5 font-semibold">Category</th>', '<th className="px-5 py-2.5 font-semibold">Categoría</th>'],
  ['<th className="px-5 py-2.5 font-semibold">Severity</th>', '<th className="px-5 py-2.5 font-semibold">Gravedad</th>'],
  ['<th className="px-5 py-2.5 font-semibold">Usage</th>', '<th className="px-5 py-2.5 font-semibold">Usos</th>'],
  ['\'Not set\'', '\'No establecida\''],
  ['Uncategorized', 'Sin categoría'],
  ['{c.category ? <Badge>{c.category}</Badge> :', '{c.category ? <Badge>{translateCategory(c.category)}</Badge> :'],
  ['{c.severity ? <Badge tone={c.severity.toLowerCase()}>{c.severity}</Badge> :', '{c.severity ? <Badge tone={c.severity.toLowerCase()}>{translateSeverity(c.severity)}</Badge> :'],
  ["appointment(s). Update those appointments first.", "cita(s). Modifica esas citas primero."],
  ["`Can't delete \"${condition.name}\": it's referenced in", "`No se puede eliminar \"${condition.name}\": está referenciado en"],
  ["description={deleteTarget && `Delete \"${deleteTarget.name}\"? This cannot be undone.`}", "description={deleteTarget && `¿Eliminar \"${deleteTarget.name}\"? Esta acción no se puede deshacer.`}"]
]);

// 3. ConditionDetail.jsx
replaceInFile('frontend/src/pages/ConditionDetail.jsx', [
  [
    "import { createResourceHooks } from '../lib/resource'",
    `import { createResourceHooks } from '../lib/resource'
import { translateCategory, translateSeverity } from './Conditions'`
  ],
  ["notify('Condition updated')", "notify('Diagnóstico actualizado')"],
  ["notify('Condition deleted')", "notify('Diagnóstico eliminado')"],
  ["'Failed to save condition'", "'Error al guardar diagnóstico'"],
  ["'Failed to delete condition'", "'Error al eliminar diagnóstico'"],
  ["appointment(s). Update those appointments first.", "cita(s). Modifica esas citas primero."],
  ["`Can't delete: referenced in", "`No se puede eliminar: está referenciado en"],
  ['label="Edit condition"', 'label="Editar diagnóstico"'],
  ['label="Delete condition"', 'label="Eliminar diagnóstico"'],
  ['Condition not found.', 'Diagnóstico no encontrado.'],
  ['<ArrowLeft size={15} /> Back', '<ArrowLeft size={15} /> Volver'],
  ['<dt className="font-semibold text-muted">Category</dt>', '<dt className="font-semibold text-muted">Categoría</dt>'],
  ['<dt className="font-semibold text-muted">Severity</dt>', '<dt className="font-semibold text-muted">Gravedad</dt>'],
  ['<dt className="font-semibold text-muted">ICD-10 code</dt>', '<dt className="font-semibold text-muted">Código CIE-10</dt>'],
  ['<dt className="font-semibold text-muted">Description</dt>', '<dt className="font-semibold text-muted">Descripción</dt>'],
  ['<dt className="font-semibold text-muted">Usage</dt>', '<dt className="font-semibold text-muted">Uso</dt>'],
  ['<dt className="font-semibold text-muted">Created</dt>', '<dt className="font-semibold text-muted">Creado el</dt>'],
  ['{condition.category ? <Badge>{condition.category}</Badge> : \'Uncategorized\'}', '{condition.category ? <Badge>{translateCategory(condition.category)}</Badge> : \'Sin categoría\'}'],
  ['{condition.severity ? <Badge tone={condition.severity.toLowerCase()}>{condition.severity}</Badge> : \'Not set\'}', '{condition.severity ? <Badge tone={condition.severity.toLowerCase()}>{translateSeverity(condition.severity)}</Badge> : \'No establecida\'}'],
  ['\'Not set\'', '\'No establecido\''],
  ['Related appointments', 'Citas relacionadas'],
  ['No appointments reference this condition yet.', 'Ninguna cita hace referencia a este diagnóstico todavía.'],
  ['title="Delete condition"', 'title="Eliminar diagnóstico"'],
  ['description={`Delete "${condition.name}"? This cannot be undone.`}', 'description={`¿Eliminar "${condition.name}"? Esta acción no se puede deshacer.`}'],
  [
    'Referenced in {Number(condition.usage_count) || 0} appointment(s), matched by diagnosis text',
    'Referenciado en {Number(condition.usage_count) || 0} cita(s), coincidiendo por texto de diagnóstico'
  ]
]);
