import * as fhir from "../../middleware/request/fhir";

export async function getFhirPractitonerHelper(request: any, hospitalId: any) {
  try {
    const { identityNumber, active } = request;
    const url = `/Practitioner?identifier=https://fhir.kemkes.go.id/id/nik|${identityNumber}`;
    const response: any = await fhir.get(url, hospitalId);

    if (response && response.data && response.data.entry && response.data.entry.length > 0) {
      const practitioner = response.data.entry[0].resource;

      const payload = {
        identityNumber,
        fhirId: practitioner.id,
        fhirName: practitioner.name[0].text,
        fhirPrefixName: JSON.stringify(practitioner.name[0].prefix || []),
        fhirSuffixName: JSON.stringify(practitioner.name[0].suffix || []),
        fhirGender: practitioner.gender,
        fhirMeta: response.data.entry[0],
        fhirResourceType: practitioner.resourceType,
        active
      };
      
      return payload;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching FHIR Practitioner:", error);
    return null;
  }
}
