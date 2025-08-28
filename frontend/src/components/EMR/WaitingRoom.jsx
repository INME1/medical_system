const WaitingRoom = ({ selectedPatient, assignToRoom, assignedPatients, unassignFromRoom }) => {
  return (
    <div style={{ minWidth: '200px', borderRight: '1px solid #ccc', padding: '1rem' }}>
      <div>
        <button
          onClick={() => assignToRoom(1)}
          disabled={!selectedPatient || assignedPatients[1]}
        >
          진료실 1 배정
        </button>
        {assignedPatients[1] && (
          <>
            <p>✔ {assignedPatients[1].name || assignedPatients[1].display}</p>
            <button onClick={() => unassignFromRoom(1)}>❌ 해제</button>
          </>
        )}
        {!assignedPatients[1] && <p>비어 있음</p>}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => assignToRoom(2)}
          disabled={!selectedPatient || assignedPatients[2]}
        >
          진료실 2 배정
        </button>
        {assignedPatients[2] && (
          <>
            <p>✔ {assignedPatients[2].name || assignedPatients[2].display}</p>
            <button onClick={() => unassignFromRoom(2)}>❌ 해제</button>
          </>
        )}
        {!assignedPatients[2] && <p>비어 있음</p>}
      </div>
    </div>
  );
};
export default WaitingRoom;