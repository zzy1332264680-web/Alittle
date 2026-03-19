// 验证手机号
export const validatePhone = (phone) => /^1[3-9]\d{9}$/.test(phone);

// 验证邮箱
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// 验证昵称（仅允许中文/字母/数字/下划线）
export const validateNickname = (nickname) => !/[^\u4e00-\u9fa5a-zA-Z0-9_]/.test(nickname);

// 计算密码强度
export const getPasswordStrength = (pwd) => {
  if (!pwd) return 'weak';
  // 弱：长度<8 或 仅字母/仅数字
  if (pwd.length < 8 || /^[a-zA-Z]+$/.test(pwd) || /^\d+$/.test(pwd)) {
    return 'weak';
  }
  // 强：包含字母+数字+特殊字符
  if (/[a-zA-Z]/.test(pwd) && /\d/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) {
    return 'strong';
  }
  // 中：字母+数字
  return 'medium';
};