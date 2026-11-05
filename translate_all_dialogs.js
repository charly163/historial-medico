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

// 1. AppointmentFormDialog.jsx
replaceInFile('frontend/src/components/appointments/AppointmentFormDialog.jsx', [
  [
    "const TYPES = ['Consultation', 'Follow-up', 'Emergency', 'Routine Check-up', 'Specialist Referral', 'Diagnostic', 'Treatment', 'Other']",
    `export const APPOINTMENT_TYPES = [
  { value: 'Consultation', label: 'Consulta' },
  { value: 'Follow-up', label: 'Seguimiento' },
  { value: 'Emergency', label: 'Urgencia' },
  { value: 'Routine Check-up', label: 'Control de rutina' },
  { value: 'Specialist Referral', label: 'Derivación a especialista' },
  { value: 'Diagnostic', label: 'Diagnóstico' },
  { value: 'Treatment', label: 'Tratamiento' },
  { value: 'Other', label: 'Otro' },
]`
  ],
  ["let submitLabel = appointment ? 'Update appointment' : 'Save appointment'", "let submitLabel = appointment ? 'Actualizar cita' : 'Guardar cita'"],
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Date & time"', 'label="Fecha y hora"'],
  ['<option value="">Select type</option>', '<option value="">Selecciona el tipo…</option>'],
  [
    `              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}`,
    `              {APPOINTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}`
  ],
  ['placeholder="Any additional notes or instructions…"', 'placeholder="Cualquier nota adicional o indicación…"'],
  ['label="Diagnosis"', 'label="Diagnóstico"'],
  ['>Cancel<', '>Cancelar<'],
  ["'Please select a patient'", "'Por favor selecciona un paciente'"],
  ["'Please select a date and time'", "'Por favor selecciona fecha y hora'"],
  ["'Cannot schedule an appointment in the past'", "'No se puede agendar una cita en el pasado'"]
]);

// 2. ConditionFormDialog.jsx
replaceInFile('frontend/src/components/conditions/ConditionFormDialog.jsx', [
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Select doctor</option>', '<option value="">Selecciona un médico…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Condition name"', 'label="Nombre de la condición / diagnóstico"'],
  ['label="Diagnosed date"', 'label="Fecha de diagnóstico"'],
  ['label="Diagnosing doctor"', 'label="Médico que diagnostica"'],
  ['label="Notes"', 'label="Notas"'],
  ['placeholder="Any additional notes…"', 'placeholder="Notas o comentarios adicionales…"'],
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = condition ? 'Update condition' : 'Save condition'", "let submitLabel = condition ? 'Actualizar diagnóstico' : 'Guardar diagnóstico'"],
  ["title={condition ? 'Edit condition' : 'Add new condition'}", "title={condition ? 'Editar diagnóstico' : 'Agregar nuevo diagnóstico'}"],
  ["'Condition name is required'", "'El nombre del diagnóstico es obligatorio'"],
  ["'Patient is required'", "'El paciente es obligatorio'"]
]);

// 3. DiagnosticStudyFormDialog.jsx
replaceInFile('frontend/src/components/diagnostic-studies/DiagnosticStudyFormDialog.jsx', [
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Select doctor</option>', '<option value="">Selecciona un médico…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Study name"', 'label="Nombre del estudio"'],
  ['label="Study type"', 'label="Tipo de estudio"'],
  ['label="Study date"', 'label="Fecha del estudio"'],
  ['label="Performing facility"', 'label="Centro / Lugar"'],
  ['label="Ordering doctor"', 'label="Médico solicitante"'],
  ['label="Findings"', 'label="Hallazgos"'],
  ['label="Impression"', 'label="Impresión diagnóstica"'],
  ['label="Notes"', 'label="Notas"'],
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = study ? 'Update study' : 'Save study'", "let submitLabel = study ? 'Actualizar estudio' : 'Guardar estudio'"],
  ["title={study ? 'Edit diagnostic study' : 'Add new diagnostic study'}", "title={study ? 'Editar estudio diagnóstico' : 'Agregar nuevo estudio diagnóstico'}"],
  ["'Study name is required'", "'El nombre del estudio es obligatorio'"],
  ["'Study date is required'", "'La fecha del estudio es obligatoria'"],
  ["'Patient is required'", "'El paciente es obligatorio'"]
]);

// 4. DoctorFormDialog.jsx
replaceInFile('frontend/src/components/doctors/DoctorFormDialog.jsx', [
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = doctor ? 'Update doctor' : 'Save doctor'", "let submitLabel = doctor ? 'Actualizar médico' : 'Guardar médico'"],
  ["title={doctor ? 'Edit doctor' : 'Add new doctor'}", "title={doctor ? 'Editar médico' : 'Agregar nuevo médico'}"],
  ["'First name is required'", "'El nombre es obligatorio'"],
  ["'Last name is required'", "'El apellido es obligatorio'"]
]);

// 5. LabReportFormDialog.jsx
replaceInFile('frontend/src/components/lab-reports/LabReportFormDialog.jsx', [
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Select doctor</option>', '<option value="">Selecciona un médico…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Test name"', 'label="Nombre de prueba"'],
  ['label="Category"', 'label="Categoría"'],
  ['label="Report date"', 'label="Fecha del informe"'],
  ['label="Ordering doctor"', 'label="Médico solicitante"'],
  ['label="Results summary"', 'label="Resumen de resultados"'],
  ['label="Notes"', 'label="Notas"'],
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = report ? 'Update report' : 'Save report'", "let submitLabel = report ? 'Actualizar informe' : 'Guardar informe'"],
  ["title={report ? 'Edit lab report' : 'Add new lab report'}", "title={report ? 'Editar informe de laboratorio' : 'Agregar nuevo informe de laboratorio'}"],
  ["'Test name is required'", "'El nombre de la prueba es obligatorio'"],
  ["'Report date is required'", "'La fecha del informe es obligatoria'"],
  ["'Patient is required'", "'El paciente es obligatorio'"]
]);

// 6. MedicationFormDialog.jsx
replaceInFile('frontend/src/components/medications/MedicationFormDialog.jsx', [
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Select doctor</option>', '<option value="">Selecciona un médico…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Medication name"', 'label="Nombre del medicamento"'],
  ['label="Dosage"', 'label="Dosis"'],
  ['label="Frequency"', 'label="Frecuencia"'],
  ['label="Start date"', 'label="Fecha de inicio"'],
  ['label="End date"', 'label="Fecha de fin"'],
  ['label="Prescribing doctor"', 'label="Médico prescriptor"'],
  ['label="Notes"', 'label="Notas"'],
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = medication ? 'Update medication' : 'Save medication'", "let submitLabel = medication ? 'Actualizar medicamento' : 'Guardar medicamento'"],
  ["title={medication ? 'Edit medication' : 'Add new medication'}", "title={medication ? 'Editar medicamento' : 'Agregar nuevo medicamento'}"],
  ["'Medication name is required'", "'El nombre del medicamento es obligatorio'"],
  ["'Dosage is required'", "'La dosis es obligatoria'"],
  ["'Frequency is required'", "'La frecuencia es obligatoria'"],
  ["'Patient is required'", "'El paciente es obligatorio'"]
]);

// 7. PrescriptionFormDialog.jsx
replaceInFile('frontend/src/components/prescriptions/PrescriptionFormDialog.jsx', [
  ['<option value="">Select patient</option>', '<option value="">Selecciona un paciente…</option>'],
  ['<option value="">Select doctor</option>', '<option value="">Selecciona un médico…</option>'],
  ['<option value="">Not specified</option>', '<option value="">No especificado</option>'],
  ['label="Medication name"', 'label="Nombre del medicamento"'],
  ['label="Dosage"', 'label="Dosis"'],
  ['label="Issue date"', 'label="Fecha de emisión"'],
  ['label="Expiration date"', 'label="Fecha de vencimiento"'],
  ['label="Refills"', 'label="Renovaciones"'],
  ['label="Instructions"', 'label="Instrucciones"'],
  ['label="Prescribing doctor"', 'label="Médico prescriptor"'],
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = prescription ? 'Update prescription' : 'Save prescription'", "let submitLabel = prescription ? 'Actualizar receta' : 'Guardar receta'"],
  ["title={prescription ? 'Edit prescription' : 'New prescription'}", "title={prescription ? 'Editar receta' : 'Nueva receta'}"],
  ["'Medication name is required'", "'El nombre del medicamento es obligatorio'"],
  ["'Dosage is required'", "'La dosis es obligatoria'"],
  ["'Patient is required'", "'El paciente es obligatorio'"]
]);

// 8. UserFormDialog.jsx
replaceInFile('frontend/src/components/users/UserFormDialog.jsx', [
  ['>Cancel<', '>Cancelar<'],
  ["let submitLabel = user ? 'Update user' : 'Save user'", "let submitLabel = user ? 'Actualizar usuario' : 'Guardar usuario'"],
  ["title={user ? 'Edit user' : 'Add new user'}", "title={user ? 'Editar usuario' : 'Agregar nuevo usuario'}"]
]);

// 9. ResetPasswordDialog.jsx
replaceInFile('frontend/src/components/users/ResetPasswordDialog.jsx', [
  ['>Cancel<', '>Cancelar<'],
  ['Reset password', 'Restablecer contraseña'],
  ['Resetting…', 'Restableciendo…']
]);

// 10. PhysicianLink.jsx
replaceInFile('frontend/src/components/ui/PhysicianLink.jsx', [
  ['Not specified', 'No especificado']
]);
