// ✅ Change Password (Business Account)
if (action === "changePassword") {
  const { currentPassword, newPassword } = body;

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // ✅ Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  // ✅ Password strength validation
  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!strongPasswordRegex.test(newPassword)) {
    return NextResponse.json(
      {
        error:
          "Weak password. Must include uppercase, lowercase, number, special character, and be 8+ chars long.",
      },
      { status: 400 }
    );
  }

  // ✅ Update password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return NextResponse.json(
    { success: true, message: "Password updated successfully." },
    { status: 200 }
  );
}
