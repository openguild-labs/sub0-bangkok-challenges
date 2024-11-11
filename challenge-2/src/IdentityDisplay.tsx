import React from 'react';

interface IdentityDisplayProps {
  identity: any;
}

const IdentityDisplay: React.FC<IdentityDisplayProps> = ({ identity }) => {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        margin: '20px auto',
        height: 'auto',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          color: '#333',
          borderBottom: '2px solid #ccc',
          paddingBottom: '8px',
          marginBottom: '16px',
        }}
      >
        Identity
      </h2>
      <p style={{ fontSize: '16px', margin: '8px 0', color: '#555' }}>
        <strong style={{ color: '#222' }}>Display Name:</strong> {identity[0].info.display.value || 'N/A'}
      </p>
      <p style={{ fontSize: '16px', margin: '8px 0', color: '#555' }}>
        <strong style={{ color: '#222' }}>Email:</strong> {identity[0].info.email.value || 'N/A'}
      </p>
      <p style={{ fontSize: '16px', margin: '8px 0', color: '#555' }}>
        <strong style={{ color: '#222' }}>Discord:</strong> {identity[0].info.discord.value || 'N/A'}
      </p>
    </div>
  );
};

export default IdentityDisplay; 