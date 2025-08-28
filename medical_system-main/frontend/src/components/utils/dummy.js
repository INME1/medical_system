export const generateCdssDummyResult = (patient) => {
  return {
    sample: patient.sample_id || 12,
    test_type: "LFT",
    prediction: 0,
    results: [
      { component_name: "ALT", value: 62, unit: "U/L" },
      { component_name: "AST", value: 49, unit: "U/L" },
      { component_name: "ALP", value: 105, unit: "U/L" },
      { component_name: "Albumin", value: 3.9, unit: "g/dL"},
      { component_name: "Direct Bilirubin", value: 0.9, unit: "mg/dL"},
      { component_name: "Total Bilirubin", value: 1.5, unit: "mg/dL"},
    ]
  };
};
