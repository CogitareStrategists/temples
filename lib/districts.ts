// Districts used for the "location" dropdown on temple records and the
// home "Temples by Location" section. Edit freely — this is a plain list.

export const TELANGANA_DISTRICTS = [
  "Adilabad", "Bhadradri Kothagudem", "Hanumakonda", "Hyderabad", "Jagtial",
  "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
  "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial",
  "Medak", "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda",
  "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
  "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad",
  "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri",
];

export const ANDHRA_PRADESH_DISTRICTS = [
  "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla",
  "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada",
  "Konaseema", "Krishna", "Kurnool", "Nandyal", "NTR",
  "Palnadu", "Parvathipuram Manyam", "Prakasam", "Sri Potti Sriramulu Nellore",
  "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram",
  "West Godavari", "YSR Kadapa",
];

export const ALL_DISTRICTS = [
  ...TELANGANA_DISTRICTS.map((d) => ({ state: "Telangana", district: d })),
  ...ANDHRA_PRADESH_DISTRICTS.map((d) => ({ state: "Andhra Pradesh", district: d })),
];
