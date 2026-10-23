export type GradeOption = { label: string; value: string };
export type SubjectOption = {
  name: string;
  nameEnglish: string;
  emoji: string;
};

export const grades: GradeOption[] = [
  { label: "الصف الأول رياض أطفال (KG1)", value: "kg1" },
  { label: "الصف الثاني رياض أطفال (KG2)", value: "kg2" },
  { label: "الصف الأول الابتدائي", value: "grade1" },
  { label: "الصف الثاني الابتدائي", value: "grade2" },
  { label: "الصف الثالث الابتدائي", value: "grade3" },
  { label: "الصف الرابع الابتدائي", value: "grade4" },
  { label: "الصف الخامس الابتدائي", value: "grade5" },
  { label: "الصف السادس الابتدائي", value: "grade6" },
  { label: "الصف الأول الإعدادي", value: "prep1" },
  { label: "الصف الثاني الإعدادي", value: "prep2" },
  { label: "الصف الثالث الإعدادي", value: "prep3" },
  { label: "الصف الأول الثانوي", value: "sec1" },
  { label: "الصف الثاني الثانوي", value: "sec2" },
  { label: "الصف الثالث الثانوي", value: "sec3" },
  { label: "الفرقة الأولى (الجامعة)", value: "uni1" },
  { label: "الفرقة الثانية (الجامعة)", value: "uni2" },
  { label: "الفرقة الثالثة (الجامعة)", value: "uni3" },
  { label: "الفرقة الرابعة (الجامعة)", value: "uni4" },
  { label: "الماجستير", value: "masters" },
  { label: "الدكتوراه", value: "phd" },
];

export const subjects: SubjectOption[] = [
  { name: "الرياضيات", nameEnglish: "Mathematics", emoji: "🧮" },
  { name: "الفيزياء", nameEnglish: "Physics", emoji: "⚛️" },
  { name: "الكيمياء", nameEnglish: "Chemistry", emoji: "🧪" },
  { name: "الاحياء", nameEnglish: "Biology", emoji: "🧬" },
  { name: "اللغة العربية", nameEnglish: "Arabic Language", emoji: "📖" },
  { name: "اللغة الإنجليزية", nameEnglish: "English Language", emoji: "🇬🇧" },
  { name: "اللغة الفرنسية", nameEnglish: "French Language", emoji: "🇫🇷" },
  { name: "اللغة الألمانية", nameEnglish: "German Language", emoji: "🇩🇪" },
  { name: "التاريخ", nameEnglish: "History", emoji: "📜" },
  { name: "الجغرافيا", nameEnglish: "Geography", emoji: "🌍" },
  { name: "الدراسات الاجتماعية", nameEnglish: "Social Studies", emoji: "👥" },
  { name: "التربية الدينية", nameEnglish: "Religious Education", emoji: "🙏" },
  { name: "الفلسفة", nameEnglish: "Philosophy", emoji: "🤔" },
  { name: "المنطق", nameEnglish: "Logic", emoji: "🧠" },
  { name: "علم النفس", nameEnglish: "Psychology", emoji: "🧘‍♂️" },
  { name: "علم الاجتماع", nameEnglish: "Sociology", emoji: "🫂" },
  { name: "الاقتصاد", nameEnglish: "Economics", emoji: "💰" },
  { name: "الحاسب الآلي", nameEnglish: "Computer Science", emoji: "💻" },
  { name: "البرمجة", nameEnglish: "Programming", emoji: "👨‍💻" },
  { name: "الهندسة", nameEnglish: "Engineering", emoji: "🛠️" },
  { name: "الطب", nameEnglish: "Medicine", emoji: "🩺" },
  { name: "الصيدلة", nameEnglish: "Pharmacy", emoji: "💊" },
  { name: "المحاسبة", nameEnglish: "Accounting", emoji: "📈" },
  { name: "إدارة الأعمال", nameEnglish: "Business Administration", emoji: "📊" },
  { name: "التسويق", nameEnglish: "Marketing", emoji: "📢" },
  { name: "القانون", nameEnglish: "Law", emoji: "⚖️" },
  { name: "العلوم السياسية", nameEnglish: "Political Science", emoji: "🗳️" },
];

