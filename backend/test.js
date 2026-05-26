const BASE_URL = 'http://localhost:3000';

async function testBackend() {
  console.log('=== DeskFlow Backend Verification Tests ===');

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/healthz`);
    console.log(`[Health] Status: ${healthRes.status} -> ${await healthRes.text()}`);

    // 2. Validate email error
    console.log('\n[Create] Testing validation (invalid email):');
    const invalidEmailRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Validation test',
        description: 'Testing email format',
        customerEmail: 'not-an-email',
        priority: 'high'
      })
    });
    console.log(`Status: ${invalidEmailRes.status}`);
    console.log(`Response:`, await invalidEmailRes.json());

    // 3. Create valid ticket
    console.log('\n[Create] Creating a valid urgent ticket:');
    const ticketRes = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: 'Database connection drop',
        description: 'Production db is unreachable',
        customerEmail: 'admin@company.com',
        priority: 'urgent'
      })
    });
    console.log(`Status: ${ticketRes.status}`);
    const ticket = await ticketRes.json();
    console.log(`Created Ticket:`, ticket);
    const ticketId = ticket.id || ticket._id;

    // 4. Test status transition rules
    console.log('\n[Transition] Testing invalid transition (open -> resolved):');
    const invalidTransRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' })
    });
    console.log(`Status: ${invalidTransRes.status}`);
    console.log(`Response:`, await invalidTransRes.json());

    console.log('\n[Transition] Testing valid transition (open -> in_progress):');
    const validTransRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });
    console.log(`Status: ${validTransRes.status}`);
    const updatedTicket = await validTransRes.json();
    console.log(`Updated Ticket:`, updatedTicket);

    console.log('\n[Transition] Testing valid transition (in_progress -> resolved):');
    const resolvedTransRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' })
    });
    console.log(`Status: ${resolvedTransRes.status}`);
    const resolvedTicket = await resolvedTransRes.json();
    console.log(`Resolved Ticket (check resolvedAt):`, resolvedTicket);

    console.log('\n[Transition] Testing backward transition (resolved -> in_progress):');
    const backTransRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' })
    });
    console.log(`Status: ${backTransRes.status}`);
    const backTicket = await backTransRes.json();
    console.log(`Moved Back Ticket (resolvedAt should be null):`, backTicket);

    // 5. Query stats
    console.log('\n[Stats] Querying stats:');
    const statsRes = await fetch(`${BASE_URL}/tickets/stats`);
    console.log(`Status: ${statsRes.status}`);
    console.log(`Stats Response:`, await statsRes.json());

    // 6. Delete ticket
    console.log('\n[Delete] Deleting ticket:');
    const deleteRes = await fetch(`${BASE_URL}/tickets/${ticketId}`, {
      method: 'DELETE'
    });
    console.log(`Status: ${deleteRes.status}`);
    console.log(`Response:`, await deleteRes.json());

    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Test run encountered an error:', error);
  }
}

testBackend();