const Login: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Welcome to DocuDino 🦕</h2>
        <form className="auth-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
