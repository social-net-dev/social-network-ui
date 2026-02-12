/**
 * Predefined academic fields / categories for posts and interests.
 */

export const POST_TYPES = [
  { value: "SOCIAL", label: "Xã hội", icon: "💬" },
  { value: "ACADEMIC", label: "Học thuật", icon: "📚" },
  { value: "RESOURCE", label: "Tài nguyên", icon: "📁" },
  { value: "DISCUSSION", label: "Thảo luận", icon: "💡" },
] as const;

export const ACADEMIC_FIELDS = [
  { value: "math", label: "Toán học", icon: "📐", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" },
  { value: "natural-science", label: "Khoa học tự nhiên", icon: "🔬", color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" },
  { value: "social-science", label: "Khoa học xã hội", icon: "🌍", color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" },
  { value: "humanities", label: "Nhân văn – Ngôn ngữ", icon: "📖", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300" },
  { value: "technology", label: "Công nghệ – Kỹ thuật", icon: "💻", color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300" },
  { value: "education", label: "Giáo dục", icon: "🎓", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300" },
  { value: "health", label: "Y – Sức khỏe", icon: "🏥", color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" },
  { value: "business", label: "Kinh doanh – Quản lý", icon: "📊", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300" },
  { value: "arts", label: "Nghệ thuật – Sáng tạo", icon: "🎨", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300" },
] as const;

export type PostTypeValue = typeof POST_TYPES[number]["value"];
export type FieldValue = typeof ACADEMIC_FIELDS[number]["value"];
