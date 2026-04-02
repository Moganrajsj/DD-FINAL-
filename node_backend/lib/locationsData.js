const LOCATIONS = {
  "India": {
    "Andhra Pradesh": [
      "Anantapur", "Chittoor", "East Godavari", "Guntur", "Kadapa", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", 
      "Visakhapatnam", "Vizianagaram", "West Godavari", "Alluri Sitharama Raju", "Anakapalli", "Annamayya", "Bapatla", "Eluru", 
      "Kakinada", "Konaseema", "NTR", "Palnadu", "Parvathipuram Manyam", "Sri Potti Sriramulu Nellore", "Tirupati"
    ],
    "Arunachal Pradesh": [
      "Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", 
      "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", 
      "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"
    ],
    "Assam": [
      "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", 
      "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", 
      "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", 
      "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
    "Bihar": [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", 
      "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", 
      "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "West Champaran", "Patna", "Purnia", "Rohtas", "Saharsa", 
      "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali"
    ],
    "Chhattisgarh": [
      "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", 
      "Gariaband", "Gaurela-Pendra-Marwahi", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", 
      "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"
    ],
    "Goa": [
      "North Goa", "South Goa"
    ],
    "Gujarat": [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", 
      "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kachchh", "Kheda", "Mahisagar", 
      "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", 
      "Surendranagar", "Tapi", "Vadodara", "Valsad"
    ],
    "Haryana": [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", 
      "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", 
      "Sonipat", "Yamunanagar"
    ],
    "Himachal Pradesh": [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", 
      "Solan", "Una"
    ],
    "Jharkhand": [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", 
      "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", 
      "Seraikela-Kharsawan", "Simdega", "West Singhbhum"
    ],
    "Karnataka": [
      "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", 
      "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Kalaburagi", "Hassan", "Haveri", 
      "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", 
      "Vijayapura", "Vijayanagara", "Yadgir"
    ],
    "Kerala": [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", 
      "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
    ],
    "Madhya Pradesh": [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", 
      "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", 
      "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", 
      "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", 
      "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
    ],
    "Maharashtra": [
      "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", 
      "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", 
      "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", 
      "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
    ],
    "Manipur": [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", 
      "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
    ],
    "Meghalaya": [
      "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", 
      "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
    ],
    "Mizoram": [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Saitual", "Serchhip"
    ],
    "Nagaland": [
      "Ch\u00fcmoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren", "Phek", 
      "Shamator", "Tseminy\u00fc", "Tuensang", "Wokha", "Z\u00fcnheboto"
    ],
    "Odisha": [
      "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", 
      "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", 
      "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
    ],
    "Punjab": [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", 
      "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "SAS Nagar", 
      "SBS Nagar", "Sri Muktsar Sahib", "Tarn Taran"
    ],
    "Rajasthan": [
      "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", 
      "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", 
      "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", 
      "Tonk", "Udaipur"
    ],
    "Sikkim": [
      "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"
    ],
    "Tamil Nadu": [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", 
      "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", 
      "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", 
      "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", 
      "Virudhunagar"
    ],
    "Telangana": [
      "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalapally", "Jogulamba Gadwal", 
      "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", 
      "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", 
      "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"
    ],
    "Tripura": [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"
    ],
    "Uttar Pradesh": [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", 
      "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", 
      "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", 
      "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", 
      "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", 
      "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", 
      "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", 
      "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
    ],
    "Uttarakhand": [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", 
      "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
    ],
    "West Bengal": [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", 
      "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", 
      "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"
    ],
    "Andaman and Nicobar Islands": [
      "Nicobar", "North and Middle Andaman", "South Andaman"
    ],
    "Chandigarh": [
      "Chandigarh"
    ],
    "Dadra and Nagar Haveli and Daman and Diu": [
      "Dadra and Nagar Haveli", "Daman", "Diu"
    ],
    "Delhi": [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", 
      "South East Delhi", "South West Delhi", "West Delhi"
    ],
    "Jammu and Kashmir": [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", 
      "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ],
    "Ladakh": [
      "Kargil", "Leh"
    ],
    "Lakshadweep": [
      "Lakshadweep"
    ],
    "Puducherry": [
      "Karaikal", "Mahe", "Puducherry", "Yanam"
    ]
  },
  "United States": {
    "California": [
      "Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Irvine", "Oakland", "Pasadena", "Long Beach"
    ],
    "Texas": [
      "Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "El Paso", "Plano", "Arlington", "Irving", "Lubbock"
    ],
    "New York": [
      "New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "White Plains", "Ithaca", "New Rochelle", "Utica"
    ],
    "Florida": [
      "Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "St. Petersburg", "West Palm Beach", "Sarasota", "Gainesville", "Tallahassee"
    ],
    "Illinois": [
      "Chicago", "Aurora", "Naperville", "Joliet", "Springfield", "Peoria", "Elgin", "Rockford", "Waukegan", "Champaign"
    ]
  },
  "United Kingdom": {
    "England": [
      "London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Bristol", "Sheffield", "Nottingham", "Leicester", "Oxford"
    ],
    "Scotland": [
      "Edinburgh", "Glasgow", "Aberdeen", "Dundee", "Inverness", "Stirling", "Paisley", "Perth", "Falkirk", "Ayr"
    ],
    "Wales": [
      "Cardiff", "Swansea", "Newport", "Wrexham", "Bangor", "Barry", "Neath", "Bridgend", "Cwmbran", "Merthyr Tydfil"
    ],
    "Northern Ireland": [
      "Belfast", "Derry", "Lisburn", "Newry", "Bangor", "Armagh", "Coleraine", "Antrim", "Ballymena", "Omagh"
    ]
  },
  "Canada": {
    "Ontario": [
      "Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor"
    ],
    "British Columbia": [
      "Vancouver", "Victoria", "Surrey", "Burnaby", "Richmond", "Kelowna", "Abbotsford", "Coquitlam", "Nanaimo", "Kamloops"
    ],
    "Quebec": [
      "Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Levis", "Trois-Rivieres", "Terrebonne"
    ],
    "Alberta": [
      "Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc"
    ]
  },
  "Australia": {
    "New South Wales": [
      "Sydney", "Newcastle", "Wollongong", "Central Coast", "Parramatta", "Dubbo", "Albury", "Tamworth", "Wagga Wagga", "Coffs Harbour"
    ],
    "Victoria": [
      "Melbourne", "Geelong", "Ballarat", "Bendigo", "Shepparton", "Melton", "Mildura", "Warrnambool", "Sunbury", "Traralgon"
    ],
    "Queensland": [
      "Brisbane", "Gold Coast", "Sunshine Coast", "Cairns", "Townsville", "Toowoomba", "Ipswich", "Mackay", "Rockhampton", "Bundaberg"
    ],
    "Western Australia": [
      "Perth", "Fremantle", "Bunbury", "Kalgoorlie", "Geraldton", "Albany", "Karratha", "Broome", "Port Hedland", "Mandurah"
    ]
  },
  "United Arab Emirates": {
    "Dubai": [
      "Dubai", "Jebel Ali", "Hatta", "Deira", "Bur Dubai", "Business Bay", "Dubai Marina", "Jumeirah", "Al Barsha", "Al Quoz"
    ],
    "Abu Dhabi": [
      "Abu Dhabi", "Al Ain", "Madinat Zayed", "Ruwais", "Mussafah", "Khalifa City", "Yas Island", "Saadiyat Island", "Al Reem Island", "Al Maryah Island"
    ],
    "Sharjah": [
      "Sharjah", "Khor Fakkan", "Kalba", "Dibba Al Hisn", "Al Dhaid", "Mleiha", "Al Madam", "Al Batayih", "Al Hamriyah", "Al Qasimia"
    ]
  }
};

module.exports = { LOCATIONS };
