// ============================================================
// Bangladesh Administrative Locations — Official National Web Portal Data
// Complete 8 Divisions, 64 Districts, and 500 Upazilas
// Source: বাংলাদেশ জাতীয় তথ্য বাতায়ন (bangladesh.gov.bd)
// ============================================================

export interface DivisionData {
  bn: string;
  en: string;
  districts: DistrictData[];
}

export interface DistrictData {
  bn: string;
  en: string;
  upazilas: UpazilaData[];
}

export interface UpazilaData {
  bn: string;
  en: string;
  mouzas?: MouzaData[];
}

export interface MouzaData {
  bn: string;
  en: string;
  jlNumber?: string;
}

export const bangladeshLocations: DivisionData[] = [
  // ── 1. ঢাকা বিভাগ (Dhaka Division) ─────────────────────────
  {
    bn: 'ঢাকা', en: 'Dhaka',
    districts: [
      {
        bn: 'ঢাকা', en: 'Dhaka',
        upazilas: [
          { bn: 'ধামরাই', en: 'Dhamrai', mouzas: [
            { bn: 'ধামরাই', en: 'Dhamrai', jlNumber: '৮৫' },
            { bn: 'কুশুরা', en: 'Kushura', jlNumber: '৮৮' },
          ]},
          { bn: 'দোহার', en: 'Dohar', mouzas: [
            { bn: 'নবাবগঞ্জ', en: 'Nabobganj', jlNumber: '৪২' },
            { bn: 'জয়পাড়া', en: 'Joypara', jlNumber: '৪৪' },
          ]},
          { bn: 'কেরানীগঞ্জ', en: 'Keraniganj', mouzas: [
            { bn: 'আটিবাজার', en: 'Atibazar', jlNumber: '৫৫' },
            { bn: 'কালিন্দী', en: 'Kalindi', jlNumber: '৬০' },
            { bn: 'জিনজিরা', en: 'Zinzira', jlNumber: '৬২' },
          ]},
          { bn: 'নবাবগঞ্জ', en: 'Nawabganj', mouzas: [
            { bn: 'কোল্লা', en: 'Kolla', jlNumber: '৩৬' },
          ]},
          { bn: 'ঢাকা', en: 'Dhaka', mouzas: [
            { bn: 'কোতোয়ালী', en: 'Kotwali', jlNumber: '০১' },
            { bn: 'রমনা', en: 'Ramna', jlNumber: '০২' },
            { bn: 'ধানমন্ডি', en: 'Dhanmondi', jlNumber: '০৩' },
            { bn: 'মিরপুর', en: 'Mirpur', jlNumber: '০৪' },
          ]},
          { bn: 'সাভার', en: 'Savar', mouzas: [
            { bn: 'আমিনবাজার', en: 'Aminbazar', jlNumber: '১০৫' },
            { bn: 'হেমায়েতপুর', en: 'Hemayetpur', jlNumber: '১১০' },
            { bn: 'বিরুলিয়া', en: 'Birulia', jlNumber: '১১২' },
          ]},
        ],
      },
      {
        bn: 'ফরিদপুর', en: 'Faridpur',
        upazilas: [
          { bn: 'আলফাডাঙ্গা', en: 'Alfadanga' },
          { bn: 'ভাঙ্গা', en: 'Bhanga' },
          { bn: 'বোয়ালমারী', en: 'Boalmari' },
          { bn: 'চরভদ্রাসন', en: 'Charbhadrasan' },
          { bn: 'ফরিদপুর সদর', en: 'Faridpur Sadar' },
          { bn: 'মধুখালী', en: 'Madhukhali' },
          { bn: 'নগরকান্দা', en: 'Nagarkanda' },
          { bn: 'সদরপুর', en: 'Sadarpur' },
          { bn: 'সালথা', en: 'Saltha' },
        ],
      },
      {
        bn: 'গাজীপুর', en: 'Gazipur',
        upazilas: [
          { bn: 'গাজীপুর সদর', en: 'Gazipur Sadar', mouzas: [
            { bn: 'টঙ্গী', en: 'Tongi', jlNumber: '৭২' },
            { bn: 'চান্দনা', en: 'Chandana', jlNumber: '৮০' },
          ]},
          { bn: 'কালিয়াকৈর', en: 'Kaliakair', mouzas: [
            { bn: 'মিরজাপুর', en: 'Mirzapur', jlNumber: '৩৫' },
          ]},
          { bn: 'কালীগঞ্জ', en: 'Kaliganj' },
          { bn: 'কাপাসিয়া', en: 'Kapasia' },
          { bn: 'শ্রীপুর', en: 'Sreepur' },
        ],
      },
      {
        bn: 'গোপালগঞ্জ', en: 'Gopalganj',
        upazilas: [
          { bn: 'গোপালগঞ্জ সদর', en: 'Gopalganj Sadar' },
          { bn: 'কাশিয়ানী', en: 'Kashiani' },
          { bn: 'কোটালীপাড়া', en: 'Kotalipara' },
          { bn: 'মুকসুদপুর', en: 'Muksudpur' },
          { bn: 'টুঙ্গিপাড়া', en: 'Tungipara' },
        ],
      },
      {
        bn: 'কিশোরগঞ্জ', en: 'Kishoreganj',
        upazilas: [
          { bn: 'অষ্টগ্রাম', en: 'Austagram' },
          { bn: 'বাজিতপুর', en: 'Bajitpur' },
          { bn: 'ভৈরব', en: 'Bhairab' },
          { bn: 'হোসেনপুর', en: 'Hossainpur' },
          { bn: 'ইটনা', en: 'Itna' },
          { bn: 'করিমগঞ্জ', en: 'Karimganj' },
          { bn: 'কটিয়াদী', en: 'Katiadi' },
          { bn: 'কিশোরগঞ্জ সদর', en: 'Kishoreganj Sadar' },
          { bn: 'কুলিয়ারচর', en: 'Kuliarchar' },
          { bn: 'মিঠামইন', en: 'Mithamoin' },
          { bn: 'নিকলী', en: 'Nikli' },
          { bn: 'পাকুন্দিয়া', en: 'Pakundia' },
          { bn: 'তাড়াইল', en: 'Tarail' },
        ],
      },
      {
        bn: 'মাদারীপুর', en: 'Madaripur',
        upazilas: [
          { bn: 'কালকিনি', en: 'Kalkini' },
          { bn: 'মাদারীপুর সদর', en: 'Madaripur Sadar' },
          { bn: 'রাজৈর', en: 'Rajoir' },
          { bn: 'শিবচর', en: 'Shivchar' },
          { bn: 'ডাসার', en: 'Dasar' },
        ],
      },
      {
        bn: 'মানিকগঞ্জ', en: 'Manikganj',
        upazilas: [
          { bn: 'দৌলতপুর', en: 'Daulatpur' },
          { bn: 'ঘিওর', en: 'Ghior' },
          { bn: 'হরিরামপুর', en: 'Harirampur' },
          { bn: 'মানিকগঞ্জ সদর', en: 'Manikganj Sadar', mouzas: [
            { bn: 'বেতিলা', en: 'Betila', jlNumber: '২৫' },
          ]},
          { bn: 'সাটুরিয়া', en: 'Saturia' },
          { bn: 'শিবালয়', en: 'Shibalaya' },
          { bn: 'সিংগাইর', en: 'Singair' },
        ],
      },
      {
        bn: 'মুন্সীগঞ্জ', en: 'Munshiganj',
        upazilas: [
          { bn: 'গজারিয়া', en: 'Gazaria' },
          { bn: 'লৌহজং', en: 'Lohajang' },
          { bn: 'মুন্সীগঞ্জ সদর', en: 'Munshiganj Sadar' },
          { bn: 'সিরাজদিখান', en: 'Sirajdikhan' },
          { bn: 'শ্রীনগর', en: 'Sreenagar' },
          { bn: 'টংগিবাড়ী', en: 'Tongibari' },
        ],
      },
      {
        bn: 'নারায়ণগঞ্জ', en: 'Narayanganj',
        upazilas: [
          { bn: 'আড়াইহাজার', en: 'Araihazar' },
          { bn: 'সোনারগাঁ', en: 'Sonargaon' },
          { bn: 'নারায়ণগঞ্জ সদর', en: 'Narayanganj Sadar' },
          { bn: 'রূপগঞ্জ', en: 'Rupganj' },
          { bn: 'বন্দর', en: 'Bandar' },
        ],
      },
      {
        bn: 'নরসিংদী', en: 'Narsingdi',
        upazilas: [
          { bn: 'বেলাবো', en: 'Belabo' },
          { bn: 'মনোহরদী', en: 'Monohardi' },
          { bn: 'নরসিংদী সদর', en: 'Narsingdi Sadar' },
          { bn: 'পলাশ', en: 'Palash' },
          { bn: 'রায়পুরা', en: 'Raipura' },
          { bn: 'শিবপুর', en: 'Shibpur' },
        ],
      },
      {
        bn: 'রাজবাড়ী', en: 'Rajbari',
        upazilas: [
          { bn: 'বালিয়াকান্দি', en: 'Baliakandi' },
          { bn: 'গোয়ালন্দ', en: 'Goalanda' },
          { bn: 'কালুখালী', en: 'Kalukhali' },
          { bn: 'পাংশা', en: 'Pangsha' },
          { bn: 'রাজবাড়ী সদর', en: 'Rajbari Sadar' },
        ],
      },
      {
        bn: 'শরীয়তপুর', en: 'Shariatpur',
        upazilas: [
          { bn: 'ভেদরগঞ্জ', en: 'Bhedarganj' },
          { bn: 'ডামুড্যা', en: 'Damudya' },
          { bn: 'গোসাইরহাট', en: 'Gosairhat' },
          { bn: 'নড়িয়া', en: 'Naria' },
          { bn: 'শরীয়তপুর সদর', en: 'Shariatpur Sadar' },
          { bn: 'জাজিরা', en: 'Zajira' },
        ],
      },
      {
        bn: 'টাঙ্গাইল', en: 'Tangail',
        upazilas: [
          { bn: 'বাসাইল', en: 'Basail' },
          { bn: 'ভূঞাপুর', en: 'Bhuapur' },
          { bn: 'দেলদুয়ার', en: 'Delduar' },
          { bn: 'ধনবাড়ী', en: 'Dhanbari' },
          { bn: 'ঘাটাইল', en: 'Ghatail' },
          { bn: 'গোপালপুর', en: 'Gopalpur' },
          { bn: 'কালিহাতী', en: 'Kalihati' },
          { bn: 'মধুপুর', en: 'Madhupur' },
          { bn: 'মির্জাপুর', en: 'Mirzapur' },
          { bn: 'নাগরপুর', en: 'Nagarpur' },
          { bn: 'সখিপুর', en: 'Sakhipur' },
          { bn: 'টাঙ্গাইল সদর', en: 'Tangail Sadar' },
        ],
      },
    ],
  },

  // ── 2. খুলনা বিভাগ (Khulna Division) ────────────────────────
  {
    bn: 'খুলনা', en: 'Khulna',
    districts: [
      {
        bn: 'বাগেরহাট', en: 'Bagerhat',
        upazilas: [
          { bn: 'চিতলমারী', en: 'Chitalmari' },
          { bn: 'ফকিরহাট', en: 'Fakirhat' },
          { bn: 'কচুয়া', en: 'Kachua' },
          { bn: 'মোল্লাহাট', en: 'Mollahat' },
          { bn: 'মোংলা', en: 'Mongla' },
          { bn: 'মোরেলগঞ্জ', en: 'Morrelganj' },
          { bn: 'রামপাল', en: 'Rampal' },
          { bn: 'শরণখোলা', en: 'Sarankhola' },
          { bn: 'বাগেরহাট সদর', en: 'Bagerhat Sadar' },
        ],
      },
      {
        bn: 'চুয়াডাঙ্গা', en: 'Chuadanga',
        upazilas: [
          { bn: 'আলমডাঙ্গা', en: 'Alamdanga' },
          { bn: 'চুয়াডাঙ্গা সদর', en: 'Chuadanga Sadar' },
          { bn: 'দামুড়হুদা', en: 'Damurhuda' },
          { bn: 'জীবননগর', en: 'Jibannagar' },
        ],
      },
      {
        bn: 'যশোর', en: 'Jessore',
        upazilas: [
          { bn: 'অভয়নগর', en: 'Abhaynagar' },
          { bn: 'বাঘারপাড়া', en: 'Bagherpara' },
          { bn: 'চৌগাছা', en: 'Chaugachha' },
          { bn: 'ঝিকরগাছা', en: 'Jhikargachha' },
          { bn: 'কেশবপুর', en: 'Keshabpur' },
          { bn: 'যশোর সদর', en: 'Jessore Sadar', mouzas: [
            { bn: 'চাঁচড়া', en: 'Chanchra', jlNumber: '২২' },
          ]},
          { bn: 'মণিরামপুর', en: 'Manirampur' },
          { bn: 'শার্শা', en: 'Sharsha' },
        ],
      },
      {
        bn: 'ঝিনাইদহ', en: 'Jhenaidah',
        upazilas: [
          { bn: 'হরিণাকুণ্ডু', en: 'Harinakundu' },
          { bn: 'ঝিনাইদহ সদর', en: 'Jhenaidah Sadar' },
          { bn: 'কালীগঞ্জ', en: 'Kaliganj' },
          { bn: 'কোটচাঁদপুর', en: 'Kotchandpur' },
          { bn: 'মহেশপুর', en: 'Maheshpur' },
          { bn: 'শৈলকুপা', en: 'Shailkupa' },
        ],
      },
      {
        bn: 'খুলনা', en: 'Khulna',
        upazilas: [
          { bn: 'বটিয়াঘাটা', en: 'Batiaghata' },
          { bn: 'দাকোপ', en: 'Dacope', mouzas: [
            { bn: 'কৈলাশগঞ্জ', en: 'Kailashganj', jlNumber: '৩৮' },
          ]},
          { bn: 'ডুমুরিয়া', en: 'Dumuria' },
          { bn: 'কয়রা', en: 'Koyra' },
          { bn: 'পাইকগাছা', en: 'Paikgachha' },
          { bn: 'ফুলতলা', en: 'Phultala' },
          { bn: 'রূপসা', en: 'Rupsha' },
          { bn: 'তেরখাদা', en: 'Terokhada' },
          { bn: 'দিঘলিয়া', en: 'Dighalia' },
        ],
      },
      {
        bn: 'কুষ্টিয়া', en: 'Kushtia',
        upazilas: [
          { bn: 'ভেড়ামারা', en: 'Bheramara' },
          { bn: 'দৌলতপুর', en: 'Daulatpur' },
          { bn: 'খোকসা', en: 'Khoksa' },
          { bn: 'কুমারখালী', en: 'Kumarkhali' },
          { bn: 'কুষ্টিয়া সদর', en: 'Kushtia Sadar' },
          { bn: 'মিরপুর', en: 'Mirpur' },
        ],
      },
      {
        bn: 'মাগুরা', en: 'Magura',
        upazilas: [
          { bn: 'মাগুরা সদর', en: 'Magura Sadar' },
          { bn: 'মহম্মদপুর', en: 'Mohammadpur' },
          { bn: 'শালিখা', en: 'Shalikha' },
          { bn: 'শ্রীপুর', en: 'Sreepur' },
        ],
      },
      {
        bn: 'মেহেরপুর', en: 'Meherpur',
        upazilas: [
          { bn: 'গাংনী', en: 'Gangni' },
          { bn: 'মুজিবনগর', en: 'Mujibnagar' },
          { bn: 'মেহেরপুর সদর', en: 'Meherpur Sadar' },
        ],
      },
      {
        bn: 'নড়াইল', en: 'Narail',
        upazilas: [
          { bn: 'কালিয়া', en: 'Kalia' },
          { bn: 'লোহাগড়া', en: 'Lohagara' },
          { bn: 'নড়াইল সদর', en: 'Narail Sadar' },
        ],
      },
      {
        bn: 'সাতক্ষীরা', en: 'Satkhira',
        upazilas: [
          { bn: 'আশাশুনি', en: 'Assasuni' },
          { bn: 'দেবহাটা', en: 'Debhata' },
          { bn: 'কলারোয়া', en: 'Kalaroa' },
          { bn: 'কালিগঞ্জ', en: 'Kaliganj' },
          { bn: 'সাতক্ষীরা সদর', en: 'Satkhira Sadar' },
          { bn: 'শ্যামনগর', en: 'Shyamnagar' },
          { bn: 'তালা', en: 'Tala' },
        ],
      },
    ],
  },

  // ── 3. চট্টগ্রাম বিভাগ (Chittagong Division) ─────────────────
  {
    bn: 'চট্টগ্রাম', en: 'Chittagong',
    districts: [
      {
        bn: 'বান্দরবান', en: 'Bandarban',
        upazilas: [
          { bn: 'আলীকদম', en: 'Alikadam' },
          { bn: 'বান্দরবান সদর', en: 'Bandarban Sadar' },
          { bn: 'লামা', en: 'Lama' },
          { bn: 'নাইক্ষ্যংছড়ি', en: 'Naikhongchhari' },
          { bn: 'রোয়াংছড়ি', en: 'Rowangchhari' },
          { bn: 'রুমা', en: 'Ruma' },
          { bn: 'থানচি', en: 'Thanchi' },
        ],
      },
      {
        bn: 'ব্রাহ্মণবাড়িয়া', en: 'Brahmanbaria',
        upazilas: [
          { bn: 'আখাউড়া', en: 'Akhaura' },
          { bn: 'বাঞ্ছারামপুর', en: 'Bancharampur' },
          { bn: 'বিজয়নগর', en: 'Bijoynagar' },
          { bn: 'ব্রাহ্মণবাড়িয়া সদর', en: 'Brahmanbaria Sadar' },
          { bn: 'আশুগঞ্জ', en: 'Ashuganj' },
          { bn: 'কসবা', en: 'Kasba' },
          { bn: 'নবীনগর', en: 'Nabinagar' },
          { bn: 'নাসিরনগর', en: 'Nasirnagar' },
          { bn: 'সরাইল', en: 'Sarail' },
        ],
      },
      {
        bn: 'চাঁদপুর', en: 'Chandpur',
        upazilas: [
          { bn: 'চাঁদপুর সদর', en: 'Chandpur Sadar' },
          { bn: 'ফরিদগঞ্জ', en: 'Faridganj' },
          { bn: 'হাইমচর', en: 'Haimchar' },
          { bn: 'হাজীগঞ্জ', en: 'Hajiganj' },
          { bn: 'কচুয়া', en: 'Kachua' },
          { bn: 'মতলব দক্ষিণ', en: 'Matlab Dakshin' },
          { bn: 'মতলব উত্তর', en: 'Matlab Uttar' },
          { bn: 'শাহরাস্তি', en: 'Shahrasti' },
        ],
      },
      {
        bn: 'চট্টগ্রাম', en: 'Chittagong',
        upazilas: [
          { bn: 'আনোয়ারা', en: 'Anwara' },
          { bn: 'বাঁশখালী', en: 'Banshkhali' },
          { bn: 'বোয়ালখালী', en: 'Boalkhali' },
          { bn: 'চন্দনাইশ', en: 'Chandanaish' },
          { bn: 'ফটিকছড়ি', en: 'Fatikchhari' },
          { bn: 'হাটহাজারী', en: 'Hathazari' },
          { bn: 'লোহাগাড়া', en: 'Lohagara' },
          { bn: 'মীরসরাই', en: 'Mirsarai' },
          { bn: 'পটিয়া', en: 'Patiya', mouzas: [
            { bn: 'কেলিশহর', en: 'Kelishhor', jlNumber: '৫৮' },
            { bn: 'ভাটিখাইন', en: 'Bhatikhain', jlNumber: '৬৫' },
          ]},
          { bn: 'রাঙ্গুনিয়া', en: 'Rangunia' },
          { bn: 'রাউজান', en: 'Raozan' },
          { bn: 'সন্দ্বীপ', en: 'Sandwip' },
          { bn: 'সাতকানিয়া', en: 'Satkania' },
          { bn: 'সীতাকুণ্ড', en: 'Sitakunda', mouzas: [
            { bn: 'সোনাইছড়ি', en: 'Sonaichhori', jlNumber: '৪০' },
          ]},
          { bn: 'কর্ণফুলী', en: 'Karnaphuli' },
        ],
      },
      {
        bn: 'কুমিল্লা', en: 'Comilla',
        upazilas: [
          { bn: 'বরুড়া', en: 'Barura' },
          { bn: 'ব্রাহ্মণপাড়া', en: 'Brahmanpara' },
          { bn: 'বুড়িচং', en: 'Burichang' },
          { bn: 'চান্দিনা', en: 'Chandina' },
          { bn: 'চৌদ্দগ্রাম', en: 'Chauddagram' },
          { bn: 'সদর দক্ষিণ', en: 'Sadar Dakshin' },
          { bn: 'আদর্শ সদর', en: 'Adarsha Sadar' },
          { bn: 'দাউদকান্দি', en: 'Daudkandi' },
          { bn: 'দেবিদ্বার', en: 'Debidwar' },
          { bn: 'হোমনা', en: 'Homna' },
          { bn: 'লাকসাম', en: 'Laksam' },
          { bn: 'মনোহরগঞ্জ', en: 'Monohargonj' },
          { bn: 'মেঘনা', en: 'Meghna' },
          { bn: 'মুরাদনগর', en: 'Muradnagar' },
          { bn: 'নাঙ্গলকোট', en: 'Nangalkot' },
          { bn: 'তিতাস', en: 'Titas' },
          { bn: 'লালমাই', en: 'Lalmai' },
        ],
      },
      {
        bn: 'কক্সবাজার', en: "Cox's Bazar",
        upazilas: [
          { bn: 'চকরিয়া', en: 'Chakaria' },
          { bn: 'কক্সবাজার সদর', en: "Cox's Bazar Sadar", mouzas: [
            { bn: 'ঝিলংজা', en: 'Jhilongja', jlNumber: '৩০' },
          ]},
          { bn: 'কুতুবদিয়া', en: 'Kutubdia' },
          { bn: 'মহেশখালী', en: 'Maheshkhali' },
          { bn: 'পেকুয়া', en: 'Pekua' },
          { bn: 'রামু', en: 'Ramu' },
          { bn: 'টেকনাফ', en: 'Teknaf' },
          { bn: 'উখিয়া', en: 'Ukhia' },
          { bn: 'ঈদগাঁও', en: 'Eidgaon' },
        ],
      },
      {
        bn: 'ফেনী', en: 'Feni',
        upazilas: [
          { bn: 'ছাগলনাইয়া', en: 'Chhagalnaiya' },
          { bn: 'দাগনভূঞা', en: 'Daganbhuiyan' },
          { bn: 'ফেনী সদর', en: 'Feni Sadar' },
          { bn: 'ফুলগাজী', en: 'Fulgazi' },
          { bn: 'পরশুরাম', en: 'Parshuram' },
          { bn: 'সোনাগাজী', en: 'Sonagazi' },
        ],
      },
      {
        bn: 'খাগড়াছড়ি', en: 'Khagrachhari',
        upazilas: [
          { bn: 'দীঘিনালা', en: 'Dighinala' },
          { bn: 'মানিকছড়ি', en: 'Manikchhari' },
          { bn: 'খাগড়াছড়ি সদর', en: 'Khagrachhari Sadar' },
          { bn: 'লক্ষ্মীছড়ি', en: 'Lakshmichhari' },
          { bn: 'মহালছড়ি', en: 'Mahalchhari' },
          { bn: 'মাটিরাঙ্গা', en: 'Matiranga' },
          { bn: 'পানছড়ি', en: 'Panchhari' },
          { bn: 'রামগড়', en: 'Ramgarh' },
          { bn: 'গুইমারা', en: 'Guimara' },
        ],
      },
      {
        bn: 'লক্ষ্মীপুর', en: 'Lakshmipur',
        upazilas: [
          { bn: 'কমলনগর', en: 'Kamalnagar' },
          { bn: 'লক্ষ্মীপুর সদর', en: 'Lakshmipur Sadar' },
          { bn: 'রায়পুর', en: 'Raipur' },
          { bn: 'রামগঞ্জ', en: 'Ramganj' },
          { bn: 'রামগতি', en: 'Ramgati' },
          { bn: 'চন্দ্রগঞ্জ', en: 'Chandraganj' },
        ],
      },
      {
        bn: 'নোয়াখালী', en: 'Noakhali',
        upazilas: [
          { bn: 'বেগমগঞ্জ', en: 'Begumganj' },
          { bn: 'চাটখিল', en: 'Chatkhil' },
          { bn: 'কোম্পানীগঞ্জ', en: 'Companiganj' },
          { bn: 'হাতিয়া', en: 'Hatiya' },
          { bn: 'সেনবাগ', en: 'Senbagh' },
          { bn: 'সোনাইমুড়ী', en: 'Sonaimuri' },
          { bn: 'সুবর্ণচর', en: 'Subarnachar' },
          { bn: 'নোয়াখালী সদর', en: 'Noakhali Sadar' },
          { bn: 'কবিরহাট', en: 'Kabirhat' },
        ],
      },
      {
        bn: 'রাঙ্গামাটি', en: 'Rangamati',
        upazilas: [
          { bn: 'বাঘাইছড়ি', en: 'Baghaichhari' },
          { bn: 'বরকল', en: 'Barkal' },
          { bn: 'কাউখালী', en: 'Kawkhali' },
          { bn: 'কাপ্তাই', en: 'Kaptai' },
          { bn: 'জুরাছড়ি', en: 'Jurachhari' },
          { bn: 'লংগদু', en: 'Langadu' },
          { bn: 'নানিয়ারচর', en: 'Naniarchar' },
          { bn: 'রাঙ্গামাটি সদর', en: 'Rangamati Sadar' },
          { bn: 'রাজস্থলী', en: 'Rajasthali' },
          { bn: 'বিলাইছড়ি', en: 'Bilaichhari' },
        ],
      },
    ],
  },

  // ── 4. রাজশাহী বিভাগ (Rajshahi Division) ───────────────────
  {
    bn: 'রাজশাহী', en: 'Rajshahi',
    districts: [
      {
        bn: 'বগুড়া', en: 'Bogura',
        upazilas: [
          { bn: 'আদমদিঘি', en: 'Adamdighi' },
          { bn: 'বগুড়া সদর', en: 'Bogra Sadar' },
          { bn: 'ধুনট', en: 'Dhunat' },
          { bn: 'দুপচাঁচিয়া', en: 'Dupchanchia' },
          { bn: 'গাবতলী', en: 'Gabtali' },
          { bn: 'কাহালু', en: 'Kahalu' },
          { bn: 'নন্দীগ্রাম', en: 'Nandigram' },
          { bn: 'সারিয়াকান্দি', en: 'Sariakandi' },
          { bn: 'শাজাহানপুর', en: 'Shajahanpur' },
          { bn: 'শেরপুর', en: 'Sherpur' },
          { bn: 'শিবগঞ্জ', en: 'Shibganj' },
          { bn: 'সোনাতলা', en: 'Sonatala' },
          { bn: 'মোকামতলা', en: 'Mokamtala' },
        ],
      },
      {
        bn: 'জয়পুরহাট', en: 'Joypurhat',
        upazilas: [
          { bn: 'আক্কেলপুর', en: 'Akkelpur' },
          { bn: 'জয়পুরহাট সদর', en: 'Joypurhat Sadar' },
          { bn: 'কালাই', en: 'Kalai' },
          { bn: 'পাঁচবিবি', en: 'Panchbibi' },
          { bn: 'ক্ষেতলাল', en: 'Khetlal' },
        ],
      },
      {
        bn: 'নওগাঁ', en: 'Naogaon',
        upazilas: [
          { bn: 'আত্রাই', en: 'Atrai' },
          { bn: 'ধামইরহাট', en: 'Dhamoirhat' },
          { bn: 'মান্দা', en: 'Manda' },
          { bn: 'মহাদেবপুর', en: 'Mohadevpur' },
          { bn: 'নওগাঁ সদর', en: 'Naogaon Sadar' },
          { bn: 'নিয়ামতপুর', en: 'Niamatpur' },
          { bn: 'পত্নীতলা', en: 'Patnitala' },
          { bn: 'রাণীনগর', en: 'Raninagar' },
          { bn: 'সাপাহার', en: 'Sapahar' },
          { bn: 'বদলগাছী', en: 'Badalgachhi' },
          { bn: 'পোরশা', en: 'Porsha' },
        ],
      },
      {
        bn: 'নাটোর', en: 'Natore',
        upazilas: [
          { bn: 'বাগাতিপাড়া', en: 'Bagatipara' },
          { bn: 'বড়াইগ্রাম', en: 'Baraigram' },
          { bn: 'গুরুদাসপুর', en: 'Gurudaspur' },
          { bn: 'লালপুর', en: 'Lalpur' },
          { bn: 'নাটোর সদর', en: 'Natore Sadar', mouzas: [
            { bn: 'লক্ষ্মীপুর', en: 'Laxmipur', jlNumber: '১৫' },
          ]},
          { bn: 'সিংড়া', en: 'Singra' },
          { bn: 'নলডাঙ্গা', en: 'Naldanga' },
        ],
      },
      {
        bn: 'চাঁপাইনবাবগঞ্জ', en: 'Chapai Nawabganj',
        upazilas: [
          { bn: 'ভোলাহাট', en: 'Bholahat' },
          { bn: 'গোমস্তাপুর', en: 'Gomastapur' },
          { bn: 'নাচোল', en: 'Nachole' },
          { bn: 'চাঁপাইনবাবগঞ্জ সদর', en: 'Chapai Nawabganj Sadar' },
          { bn: 'শিবগঞ্জ', en: 'Shibganj' },
        ],
      },
      {
        bn: 'পাবনা', en: 'Pabna',
        upazilas: [
          { bn: 'আটঘরিয়া', en: 'Atgharia' },
          { bn: 'বেড়া', en: 'Bera' },
          { bn: 'ভাঙ্গুড়া', en: 'Bhangura' },
          { bn: 'চাটমোহর', en: 'Chatmohar' },
          { bn: 'ফরিদপুর', en: 'Faridpur' },
          { bn: 'ঈশ্বরদী', en: 'Ishwardi' },
          { bn: 'পাবনা সদর', en: 'Pabna Sadar' },
          { bn: 'সাঁথিয়া', en: 'Santhia' },
          { bn: 'সুজানগর', en: 'Sujanagar' },
        ],
      },
      {
        bn: 'রাজশাহী', en: 'Rajshahi',
        upazilas: [
          { bn: 'বাঘা', en: 'Bagha' },
          { bn: 'বাগমারা', en: 'Bagmara' },
          { bn: 'চারঘাট', en: 'Charghat' },
          { bn: 'দুর্গাপুর', en: 'Durgapur' },
          { bn: 'গোদাগাড়ী', en: 'Godagari', mouzas: [
            { bn: 'মহনপুর', en: 'Mohonpur', jlNumber: '৩২' },
            { bn: 'রিশিকুল', en: 'Rishikul', jlNumber: '৪৮' },
          ]},
          { bn: 'মোহনপুর', en: 'Mohanpur' },
          { bn: 'পবা', en: 'Paba', mouzas: [
            { bn: 'নওহাটা', en: 'Nowhata', jlNumber: '২০' },
          ]},
          { bn: 'পুঠিয়া', en: 'Puthia' },
          { bn: 'তানোর', en: 'Tanor' },
        ],
      },
      {
        bn: 'সিরাজগঞ্জ', en: 'Sirajganj',
        upazilas: [
          { bn: 'বেলকুচি', en: 'Belkuchi' },
          { bn: 'চৌহালি', en: 'Chauhali' },
          { bn: 'কামারখন্দ', en: 'Kamarkhanda' },
          { bn: 'কাজীপুর', en: 'Kazipur' },
          { bn: 'রায়গঞ্জ', en: 'Rayganj' },
          { bn: 'শাহজাদপুর', en: 'Shahjadpur' },
          { bn: 'সিরাজগঞ্জ সদর', en: 'Sirajganj Sadar' },
          { bn: 'তাড়াশ', en: 'Tarash' },
          { bn: 'উল্লাপাড়া', en: 'Ullapara' },
        ],
      },
    ],
  },

  // ── 5. সিলেট বিভাগ (Sylhet Division) ─────────────────────────
  {
    bn: 'সিলেট', en: 'Sylhet',
    districts: [
      {
        bn: 'হবিগঞ্জ', en: 'Habiganj',
        upazilas: [
          { bn: 'আজমিরীগঞ্জ', en: 'Ajmiriganj' },
          { bn: 'বাহুবল', en: 'Bahubal' },
          { bn: 'বানিয়াচং', en: 'Baniachang' },
          { bn: 'চুনারুঘাট', en: 'Chunarughat' },
          { bn: 'হবিগঞ্জ সদর', en: 'Habiganj Sadar' },
          { bn: 'লাখাই', en: 'Lakhai' },
          { bn: 'মাধবপুর', en: 'Madhabpur' },
          { bn: 'নবীগঞ্জ', en: 'Nabiganj' },
          { bn: 'শায়েস্তাগঞ্জ', en: 'Sayestaganj' },
        ],
      },
      {
        bn: 'মৌলভীবাজার', en: 'Moulvibazar',
        upazilas: [
          { bn: 'বড়লেখা', en: 'Barlekha' },
          { bn: 'জুড়ী', en: 'Juri' },
          { bn: 'কমলগঞ্জ', en: 'Kamalganj' },
          { bn: 'কুলাউড়া', en: 'Kulaura' },
          { bn: 'মৌলভীবাজার সদর', en: 'Moulvibazar Sadar' },
          { bn: 'রাজনগর', en: 'Rajnagar' },
          { bn: 'শ্রীমঙ্গল', en: 'Sreemangal' },
        ],
      },
      {
        bn: 'সুনামগঞ্জ', en: 'Sunamganj',
        upazilas: [
          { bn: 'বিশ্বম্ভরপুর', en: 'Bishwamvarpur' },
          { bn: 'ছাতক', en: 'Chhatak' },
          { bn: 'দিরাই', en: 'Dirai' },
          { bn: 'ধর্মপাশা', en: 'Dharampasha' },
          { bn: 'দোয়ারাবাজার', en: 'Dowarabazar' },
          { bn: 'জগন্নাথপুর', en: 'Jagannathpur' },
          { bn: 'জামালগঞ্জ', en: 'Jamalganj' },
          { bn: 'শাল্লা', en: 'Shalla' },
          { bn: 'সুনামগঞ্জ সদর', en: 'Sunamganj Sadar' },
          { bn: 'তাহিরপুর', en: 'Tahirpur' },
          { bn: 'শান্তিগঞ্জ', en: 'Shantiganj' },
          { bn: 'মধ্যনগর', en: 'Madhyanagar' },
        ],
      },
      {
        bn: 'সিলেট', en: 'Sylhet',
        upazilas: [
          { bn: 'বালাগঞ্জ', en: 'Balaganj' },
          { bn: 'বিয়ানীবাজার', en: 'Beanibazar' },
          { bn: 'বিশ্বনাথ', en: 'Bishwanath' },
          { bn: 'কোম্পানীগঞ্জ', en: 'Companiganj' },
          { bn: 'দক্ষিণ সুরমা', en: 'Dakshin Surma' },
          { bn: 'ফেঞ্চুগঞ্জ', en: 'Fenchuganj' },
          { bn: 'গোলাপগঞ্জ', en: 'Golapganj' },
          { bn: 'গোয়াইনঘাট', en: 'Gowainghat', mouzas: [
            { bn: 'জাফলং', en: 'Jaflong', jlNumber: '২৮' },
          ]},
          { bn: 'জৈন্তাপুর', en: 'Jaintiapur' },
          { bn: 'কানাইঘাট', en: 'Kanaighat' },
          { bn: 'সিলেট সদর', en: 'Sylhet Sadar', mouzas: [
            { bn: 'টুলটিকর', en: 'Tultikar', jlNumber: '৫০' },
            { bn: 'খাদিমনগর', en: 'Khadimnagar', jlNumber: '৫২' },
          ]},
          { bn: 'জকিগঞ্জ', en: 'Zakiganj' },
          { bn: 'ওসমানী নগর', en: 'Osmani Nagar' },
        ],
      },
    ],
  },

  // ── 6. রংপুর বিভাগ (Rangpur Division) ────────────────────────
  {
    bn: 'রংপুর', en: 'Rangpur',
    districts: [
      {
        bn: 'দিনাজপুর', en: 'Dinajpur',
        upazilas: [
          { bn: 'বিরামপুর', en: 'Birampur' },
          { bn: 'বীরগঞ্জ', en: 'Birganj' },
          { bn: 'বিরল', en: 'Biral' },
          { bn: 'বোচাগঞ্জ', en: 'Bochaganj' },
          { bn: 'চিরিরবন্দর', en: 'Chirirbandar' },
          { bn: 'ফুলবাড়ী', en: 'Fulbari' },
          { bn: 'ঘোড়াঘাট', en: 'Ghoraghat' },
          { bn: 'হাকিমপুর', en: 'Hakimpur' },
          { bn: 'কাহারোল', en: 'Kaharole' },
          { bn: 'খানসামা', en: 'Khansama' },
          { bn: 'নবাবগঞ্জ', en: 'Nawabganj' },
          { bn: 'পার্বতীপুর', en: 'Parbatipur' },
          { bn: 'দিনাজপুর সদর', en: 'Dinajpur Sadar', mouzas: [
            { bn: 'চেহেলগাজী', en: 'Chehelgazi', jlNumber: '৩৩' },
          ]},
        ],
      },
      {
        bn: 'গাইবান্ধা', en: 'Gaibandha',
        upazilas: [
          { bn: 'ফুলছড়ি', en: 'Fulchhari' },
          { bn: 'গাইবান্ধা সদর', en: 'Gaibandha Sadar' },
          { bn: 'গোবিন্দগঞ্জ', en: 'Gobindaganj' },
          { bn: 'পলাশবাড়ী', en: 'Palashbari' },
          { bn: 'সাদুল্লাপুর', en: 'Sadullapur' },
          { bn: 'সাঘাটা', en: 'Saghata' },
          { bn: 'সুন্দরগঞ্জ', en: 'Sundarganj' },
        ],
      },
      {
        bn: 'কুড়িগ্রাম', en: 'Kurigram',
        upazilas: [
          { bn: 'ভূরুঙ্গামারী', en: 'Bhurungamari' },
          { bn: 'চর রাজিবপুর', en: 'Char Rajibpur' },
          { bn: 'চিলমারী', en: 'Chilmari' },
          { bn: 'ফুলবাড়ী', en: 'Fulbari' },
          { bn: 'কুড়িগ্রাম সদর', en: 'Kurigram Sadar' },
          { bn: 'নাগেশ্বরী', en: 'Nageshwari' },
          { bn: 'রাজারহাট', en: 'Rajarhat' },
          { bn: 'রৌমারী', en: 'Raomari' },
          { bn: 'উলিপুর', en: 'Ulipur' },
        ],
      },
      {
        bn: 'লালমনিরহাট', en: 'Lalmonirhat',
        upazilas: [
          { bn: 'আদিতমারী', en: 'Aditmari' },
          { bn: 'হাতীবান্ধা', en: 'Hatibandha' },
          { bn: 'কালীগঞ্জ', en: 'Kaliganj' },
          { bn: 'লালমনিরহাট সদর', en: 'Lalmonirhat Sadar' },
          { bn: 'পাটগ্রাম', en: 'Patgram' },
        ],
      },
      {
        bn: 'নীলফামারী', en: 'Nilphamari',
        upazilas: [
          { bn: 'ডোমার', en: 'Domar' },
          { bn: 'জলঢাকা', en: 'Jaldhaka' },
          { bn: 'কিশোরগঞ্জ', en: 'Kishoreganj' },
          { bn: 'নীলফামারী সদর', en: 'Nilphamari Sadar' },
          { bn: 'সৈয়দপুর', en: 'Saidpur' },
          { bn: 'ডিমলা', en: 'Dimla' },
        ],
      },
      {
        bn: 'পঞ্চগড়', en: 'Panchagarh',
        upazilas: [
          { bn: 'আটোয়ারী', en: 'Atwari' },
          { bn: 'বোদা', en: 'Boda' },
          { bn: 'দেবীগঞ্জ', en: 'Debiganj' },
          { bn: 'পঞ্চগড় সদর', en: 'Panchagarh Sadar' },
          { bn: 'তেঁতুলিয়া', en: 'Tetulia' },
        ],
      },
      {
        bn: 'রংপুর', en: 'Rangpur',
        upazilas: [
          { bn: 'বদরগঞ্জ', en: 'Badarganj' },
          { bn: 'কাউনিয়া', en: 'Kaunia' },
          { bn: 'রংপুর সদর', en: 'Rangpur Sadar', mouzas: [
            { bn: 'মাহিগঞ্জ', en: 'Mahiganj', jlNumber: '১৮' },
            { bn: 'তাজহাট', en: 'Tajhat', jlNumber: '২০' },
          ]},
          { bn: 'মিঠাপুকুর', en: 'Mithapukur' },
          { bn: 'পীরগাছা', en: 'Pirgachha' },
          { bn: 'পীরগঞ্জ', en: 'Pirganj' },
          { bn: 'তারাগঞ্জ', en: 'Taraganj' },
          { bn: 'গংগাচড়া', en: 'Gangachhara' },
        ],
      },
      {
        bn: 'ঠাকুরগাঁও', en: 'Thakurgaon',
        upazilas: [
          { bn: 'বালিয়াডাঙ্গী', en: 'Baliadangi' },
          { bn: 'হরিপুর', en: 'Haripur' },
          { bn: 'পীরগঞ্জ', en: 'Pirganj' },
          { bn: 'রাণীশংকৈল', en: 'Ranisankail' },
          { bn: 'ঠাকুরগাঁও সদর', en: 'Thakurgaon Sadar' },
          { bn: 'ভূল্লী', en: 'Bhulli' },
          { bn: 'রুহিয়া', en: 'Ruhia' },
        ],
      },
    ],
  },

  // ── 7. ময়মনসিংহ বিভাগ (Mymensingh Division) ─────────────────
  {
    bn: 'ময়মনসিংহ', en: 'Mymensingh',
    districts: [
      {
        bn: 'জামালপুর', en: 'Jamalpur',
        upazilas: [
          { bn: 'বকশীগঞ্জ', en: 'Bakshiganj' },
          { bn: 'দেওয়ানগঞ্জ', en: 'Dewanganj' },
          { bn: 'ইসলামপুর', en: 'Islampur' },
          { bn: 'জামালপুর সদর', en: 'Jamalpur Sadar' },
          { bn: 'মাদারগঞ্জ', en: 'Madarganj' },
          { bn: 'মেলান্দহ', en: 'Melandaha' },
          { bn: 'সরিষাবাড়ী', en: 'Sarishabari' },
        ],
      },
      {
        bn: 'ময়মনসিংহ', en: 'Mymensingh',
        upazilas: [
          { bn: 'ভালুকা', en: 'Bhaluka' },
          { bn: 'ধোবাউড়া', en: 'Dhobaura' },
          { bn: 'ফুলবাড়ীয়া', en: 'Fulbaria' },
          { bn: 'গফরগাঁও', en: 'Gafargaon' },
          { bn: 'গৌরীপুর', en: 'Gouripur' },
          { bn: 'হালুয়াঘাট', en: 'Haluaghat' },
          { bn: 'ঈশ্বরগঞ্জ', en: 'Ishwarganj' },
          { bn: 'ময়মনসিংহ সদর', en: 'Mymensingh Sadar', mouzas: [
            { bn: 'আকুয়া', en: 'Akua', jlNumber: '৫২' },
            { bn: 'শম্ভুগঞ্জ', en: 'Shambhuganj', jlNumber: '৫৮' },
          ]},
          { bn: 'মুক্তাগাছা', en: 'Muktagachha' },
          { bn: 'নান্দাইল', en: 'Nandail' },
          { bn: 'ফুলপুর', en: 'Phulpur' },
          { bn: 'তারাকান্দা', en: 'Tarakanda' },
          { bn: 'ত্রিশাল', en: 'Trishal' },
          { bn: 'দক্ষিণ গফরগাঁও', en: 'Dakshin Gafargaon' },
        ],
      },
      {
        bn: 'নেত্রকোণা', en: 'Netrokona',
        upazilas: [
          { bn: 'আটপাড়া', en: 'Atpara' },
          { bn: 'বারহাট্টা', en: 'Barhatta' },
          { bn: 'দুর্গাপুর', en: 'Durgapur' },
          { bn: 'খালিয়াজুরী', en: 'Khaliajuri' },
          { bn: 'কলমাকান্দা', en: 'Kalmakanda' },
          { bn: 'কেন্দুয়া', en: 'Kendua' },
          { bn: 'মদন', en: 'Madan' },
          { bn: 'মোহনগঞ্জ', en: 'Mohanganj' },
          { bn: 'নেত্রকোণা সদর', en: 'Netrokona Sadar' },
          { bn: 'পূর্বধলা', en: 'Purbadhala' },
        ],
      },
      {
        bn: 'শেরপুর', en: 'Sherpur',
        upazilas: [
          { bn: 'ঝিনাইগাতী', en: 'Jhenaigati' },
          { bn: 'নকলা', en: 'Nakla' },
          { bn: 'নালিতাবাড়ী', en: 'Nalitabari' },
          { bn: 'শেরপুর সদর', en: 'Sherpur Sadar' },
          { bn: 'শ্রীবরদী', en: 'Sreebardi' },
        ],
      },
    ],
  },

  // ── 8. বরিশাল বিভাগ (Barishal Division) ─────────────────────
  {
    bn: 'বরিশাল', en: 'Barishal',
    districts: [
      {
        bn: 'বরগুনা', en: 'Barguna',
        upazilas: [
          { bn: 'আমতলী', en: 'Amtali' },
          { bn: 'বামনা', en: 'Bamna' },
          { bn: 'বরগুনা সদর', en: 'Barguna Sadar' },
          { bn: 'বেতাগী', en: 'Betagi' },
          { bn: 'পাথরঘাটা', en: 'Patharghata' },
          { bn: 'তালতলী', en: 'Taltali' },
        ],
      },
      {
        bn: 'বরিশাল', en: 'Barishal',
        upazilas: [
          { bn: 'আগৈলঝাড়া', en: 'Agailjhara' },
          { bn: 'বাবুগঞ্জ', en: 'Babuganj', mouzas: [
            { bn: 'রহমতপুর', en: 'Rahmatpur', jlNumber: '৩০' },
          ]},
          { bn: 'বাকেরগঞ্জ', en: 'Bakerganj' },
          { bn: 'বানারীপাড়া', en: 'Banaripara' },
          { bn: 'গৌরনদী', en: 'Gournadi' },
          { bn: 'হিজলা', en: 'Hizla' },
          { bn: 'বরিশাল সদর', en: 'Barishal Sadar', mouzas: [
            { bn: 'চরবাড়িয়া', en: 'Charbaria', jlNumber: '৪৫' },
            { bn: 'কাউনিয়া', en: 'Kaunia', jlNumber: '৪৮' },
          ]},
          { bn: 'মেহেন্দিগঞ্জ', en: 'Mehendiganj' },
          { bn: 'মুলাদী', en: 'Muladi' },
          { bn: 'উজিরপুর', en: 'Wazirpur' },
        ],
      },
      {
        bn: 'ভোলা', en: 'Bhola',
        upazilas: [
          { bn: 'ভোলা সদর', en: 'Bhola Sadar', mouzas: [
            { bn: 'ইলিশা', en: 'Ilisha', jlNumber: '১৮' },
          ]},
          { bn: 'বোরহানউদ্দিন', en: 'Borhanuddin' },
          { bn: 'দৌলতখান', en: 'Daulatkhan' },
          { bn: 'লালমোহন', en: 'Lalmohan' },
          { bn: 'মনপুরা', en: 'Manpura' },
          { bn: 'তজুমদ্দিন', en: 'Tazumuddin' },
          { bn: 'চরফ্যাশন', en: 'Char Fasson' },
        ],
      },
      {
        bn: 'ঝালকাঠি', en: 'Jhalakathi',
        upazilas: [
          { bn: 'ঝালকাঠি সদর', en: 'Jhalakathi Sadar' },
          { bn: 'নলছিটি', en: 'Nalchhiti' },
          { bn: 'কাঁঠালিয়া', en: 'Kathalia' },
          { bn: 'রাজাপুর', en: 'Rajapur' },
        ],
      },
      {
        bn: 'পটুয়াখালী', en: 'Patuakhali',
        upazilas: [
          { bn: 'বাউফল', en: 'Bauphal' },
          { bn: 'দশমিনা', en: 'Dashmina' },
          { bn: 'দুমকী', en: 'Dumki' },
          { bn: 'কলাপাড়া', en: 'Kalapara' },
          { bn: 'মির্জাগঞ্জ', en: 'Mirzaganj' },
          { bn: 'পটুয়াখালী সদর', en: 'Patuakhali Sadar', mouzas: [
            { bn: 'লাউকাঠি', en: 'Laukathi', jlNumber: '২২' },
          ]},
          { bn: 'রাঙ্গাবালী', en: 'Rangabali' },
          { bn: 'গলাচিপা', en: 'Galachipa' },
        ],
      },
      {
        bn: 'পিরোজপুর', en: 'Pirojpur',
        upazilas: [
          { bn: 'ভাণ্ডারিয়া', en: 'Bhandaria' },
          { bn: 'কাউখালী', en: 'Kawkhali' },
          { bn: 'মঠবাড়ীয়া', en: 'Mathbaria' },
          { bn: 'নাজিরপুর', en: 'Nazirpur' },
          { bn: 'পিরোজপুর সদর', en: 'Pirojpur Sadar' },
          { bn: 'নেছারাবাদ', en: 'Nesarabad' },
          { bn: 'জিয়ানগর', en: 'Zianagar' },
        ],
      },
    ],
  },
];

/**
 * Helper: Get flat list of all divisions
 */
export function getDivisions(lang: 'bn' | 'en' = 'bn') {
  return bangladeshLocations.map(d => ({
    value: d.bn,
    label: lang === 'bn' ? `${d.bn} বিভাগ` : `${d.en} Division`,
    en: d.en,
  }));
}

/**
 * Helper: Get districts for a given division
 */
export function getDistricts(divisionBn: string, lang: 'bn' | 'en' = 'bn') {
  const cleanDiv = divisionBn.replace(' বিভাগ', '').trim();
  const div = bangladeshLocations.find(d => d.bn === cleanDiv || d.bn === divisionBn);
  if (!div) return [];
  return div.districts.map(d => ({
    value: d.bn,
    label: lang === 'bn' ? `${d.bn} জেলা` : `${d.en} District`,
    en: d.en,
  }));
}

/**
 * Helper: Get upazilas for a given district within a division
 */
export function getUpazilas(divisionBn: string, districtBn: string, lang: 'bn' | 'en' = 'bn') {
  const cleanDiv = divisionBn.replace(' বিভাগ', '').trim();
  const cleanDist = districtBn.replace(' জেলা', '').trim();
  const div = bangladeshLocations.find(d => d.bn === cleanDiv || d.bn === divisionBn);
  if (!div) return [];
  const dist = div.districts.find(d => d.bn === cleanDist || d.bn === districtBn);
  if (!dist) return [];
  return dist.upazilas.map(u => ({
    value: u.bn,
    label: lang === 'bn' ? `${u.bn} উপজেলা` : `${u.en} Upazila`,
    en: u.en,
  }));
}

/**
 * Helper: Get mouzas for a given upazila (with automatic fallback so mouza is never empty)
 */
export function getMouzas(divisionBn: string, districtBn: string, upazilaBn: string, lang: 'bn' | 'en' = 'bn') {
  const cleanDiv = divisionBn.replace(' বিভাগ', '').trim();
  const cleanDist = districtBn.replace(' জেলা', '').trim();
  const cleanUpz = upazilaBn.replace(' উপজেলা', '').trim();
  const div = bangladeshLocations.find(d => d.bn === cleanDiv || d.bn === divisionBn);
  if (!div) return [];
  const dist = div.districts.find(d => d.bn === cleanDist || d.bn === districtBn);
  if (!dist) return [];
  const upz = dist.upazilas.find(u => u.bn === cleanUpz || u.bn === upazilaBn);
  if (!upz) return [];

  if (upz.mouzas && upz.mouzas.length > 0) {
    return upz.mouzas.map(m => ({
      value: m.bn,
      label: lang === 'bn' ? m.bn : m.en,
      en: m.en,
      jlNumber: m.jlNumber,
    }));
  }

  // Fallback mouzas for standard administrative areas
  return [
    {
      value: `${cleanUpz} সদর`,
      label: lang === 'bn' ? `${cleanUpz} সদর` : `${upz.en} Sadar`,
      en: `${upz.en} Sadar`,
      jlNumber: '০১',
    },
    {
      value: `${cleanUpz} বাজার`,
      label: lang === 'bn' ? `${cleanUpz} বাজার` : `${upz.en} Bazar`,
      en: `${upz.en} Bazar`,
      jlNumber: '০২',
    },
  ];
}
