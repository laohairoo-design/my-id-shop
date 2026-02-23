import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// เปลี่ยนค่าด้านล่างนี้ให้เป็นของบีเองนะ
const supabaseUrl = 'https://swprjeuianzmnrmzmtwn.supabase.co'
const supabaseKey = 'เอา Anon Key ของบีจากหน้า Settings > API ใน Supabase มาวางแทนที่ข้อความนี้'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentCustomer = null;

// ระบบเช็คการล็อกอิน
async function checkClient() {
    const savedName = localStorage.getItem('customer_name');
    if (!savedName) {
        document.getElementById('login-modal')?.classList.remove('hidden');
    } else {
        const { data } = await supabase.from('profiles').select('*').eq('username', savedName).single();
        if (data) {
            currentCustomer = data;
            if(document.getElementById('client-name')) document.getElementById('client-name').innerText = data.username;
            if(document.getElementById('client-balance')) document.getElementById('client-balance').innerText = `฿ ${data.balance.toLocaleString()}`;
        }
    }
}

window.loginCustomer = async () => {
    const name = document.getElementById('user-input-name').value.trim();
    if (!name) return alert('ใส่ชื่อเล่นด้วยครับบี!');
    const { data: existing } = await supabase.from('profiles').select('*').eq('username', name).single();
    if (!existing) await supabase.from('profiles').insert([{ username: name, balance: 0 }]);
    localStorage.setItem('customer_name', name);
    location.reload();
}

// ดึงรายการสินค้ามาโชว์
async function loadData() {
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('product-list');
    if(list && prods) {
        list.innerHTML = prods.map(p => `
            <div class="glass rounded-3xl p-4 border border-white/10 hover:border-yellow-500/50 transition duration-300">
                <img src="${p.image_url}" class="w-full h-40 object-cover rounded-2xl mb-4 shadow-lg">
                <h3 class="font-bold text-sm text-slate-400 mb-1">${p.title}</h3>
                <div class="text-2xl font-black text-yellow-500 mb-4 italic">฿${p.price.toLocaleString()}</div>
                <button onclick="buyProduct(${p.price}, '${p.title}', '${p.contact}')" class="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-black py-3 rounded-2xl font-black text-xs hover:scale-95 transition">ซื้อทันที</button>
            </div>
        `).join('');
    }
}

window.buyProduct = async (price, title, contact) => {
    if(!currentCustomer) return;
    if(currentCustomer.balance < price) {
        alert('เงินไม่พอครับบี! ทักแชทเติมเงินก่อนนะ');
    } else {
        if(confirm(`ยืนยันการซื้อ ${title}?`)) {
            const newBal = currentCustomer.balance - price;
            await supabase.from('profiles').update({ balance: newBal }).eq('username', currentCustomer.username);
            await supabase.from('orders').insert([{ username: currentCustomer.username, product_title: title, product_contact: contact, price: price }]);
            alert('ซื้อสำเร็จ! ตรวจสอบรหัสได้ที่หน้าโปรไฟล์');
            location.href = 'profile.html';
        }
    }
}

checkClient(); loadData();
