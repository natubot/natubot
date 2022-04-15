if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js');
} else {
    alert('Este navegador no soporta PWA');
}

window.addEventListener('keydown', e => {
    var code = e.key;
    if (code == 'Enter') {
        var strCode = document.getElementById('txt_code').value
        $message = document.getElementById('message')
        if (strCode != "") {
            const trasaccion = db.transaction(['tbl_codes'], 'readonly')
            const coleccionObjetos = trasaccion.objectStore('tbl_codes')
            const conexion = coleccionObjetos.get(`${strCode}`)
            conexion.onsuccess = (e) => {
                console.log(conexion)
                if (conexion.result) {
                    $('#barCode').JsBarcode(strCode, { displayValue: true });
                    // Imprimir
                    $message.innerHTML = `<p class="text-success" >Imprimiendo...</p>`;
                    var canvas = document.getElementById("barCode");
                    var img = canvas.toDataURL();
                    var content = `<center><img src="${img}" height="100" width="160"></center>`;
                    var printWindow = window.open('', '', 'height=400,width=600');
                    printWindow.document.write(content);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                        printWindow.close();
                        document.getElementById('txt_code').value = "";
                        $message.innerHTML = ``;
                    }, 1000);
                } else {
                    $message.innerHTML = `<p class="text-danger" >Lo sentimos, este código no se encuentra almacenado</p>`;
                    setTimeout(() => {
                        $message.innerHTML = ``;
                    }, 3000);
                }
            }
        } else {
            $message.innerHTML = `<p class="text-danger" >Debe ingresar un código para continuar :)</p>`;
            setTimeout(() => {
                $message.innerHTML = ``;
            }, 2000);
        }
    }
});


document.getElementById('btn-action').addEventListener('click', () => {
    document.getElementById('form-codes').addEventListener('submit', e => {
        e.preventDefault()
    })
    var compliteName = document.getElementById('txtCompliteName').value
    var code = document.getElementById('txtCode').value
    var btn = document.getElementById('btn-action').value
    if (code != '' && compliteName != '') {
        if (btn == 'update') {
            actualizar({ code: code, name: compliteName })
        } else {
            agregar({ code: code, name: compliteName })
        }
    }
}, false)


const clearInput = () => {
    document.getElementById('txtCompliteName').value = ''
    document.getElementById('txtCode').value = ''
}
const updateMode = code => {
    $btn = document.getElementById('btn-action')
    var $code = document.getElementById('txtCode')
    $btn.innerHTML = `Actualizar`
    $btn.classList.remove('btn-success')
    $btn.classList.add('btn-primary')
    $btn.value = 'update'
    $code.setAttribute('readonly', '')
}
const initMode = () => {
    $btn = document.getElementById('btn-action')
    var $code = document.getElementById('txtCode')
    $btn.innerHTML = `Guardar`
    $btn.classList.remove('btn-primary')
    $btn.classList.add('btn-success')
    $btn.value = ''
    document.getElementById('txtCompliteName').value = ''
    $code.value = ''
    $code.removeAttribute('readonly')
    document.getElementById('tBody').innerHTML = ``
}
const donwloadData = () => {
    var dataJson = []
    const trasaccion = db.transaction(['tbl_codes'], 'readonly')
    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
    const conexion = coleccionObjetos.openCursor()
    conexion.onsuccess = e => {
        const cursor = e.target.result
        if (cursor) {
            dataJson.push({ key: cursor.value.code, name: cursor.value.name })
            cursor.continue()
        } else {
            var filename = 'registro.json'
            var element = document.createElement('a')
            element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(JSON.stringify(dataJson)));
            element.setAttribute('download', filename);
            document.body.appendChild(element);
            element.click();
        }
    }

}
const uploadData = () => {
    var element = document.createElement('input')
    element.type = 'file'
    element.click()
    element.addEventListener('change', e => {
        if (e.target.files[0].name.includes('.json')) {
            var file = e.target.files[0]
            var lector = new FileReader();
            lector.onload = (e) => {
                var contenido = e.target.result;
                var dataJson = JSON.parse(contenido)
                for (var data in dataJson) {
                    const trasaccion = db.transaction(['tbl_codes'], 'readwrite')
                    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
                    coleccionObjetos.add({ code: dataJson[data].key, name: dataJson[data].name })
                }
                consultar()
            }
            lector.readAsText(file)
        } else {
            alert('Tipo de archivo no soportado')
        }
    }, false)
}
const validateAdmin = () => {
    if (localStorage.getItem('password')) {
        $pass = document.getElementById('settings-txt')
        var encripPass = localStorage.getItem('password')
        const encoder = new TextEncoder()
        if (encoder.encode($pass.value) == encripPass) {
            $pass.value = ''
            document.getElementById('hiddenBtn').click()
        } else {
            $pass.value = ''
            alert('Contraseña incorrecta')
        }

    } else {
        const encoder = new TextEncoder()
        const encoderPass = encoder.encode('admin')
        localStorage.setItem('password', encoderPass)
        validateAdmin()
    }
}
const changePass = () => {
    var oldPass = document.getElementById('oldPass').value
    var newPass = document.getElementById('newPass').value
    var newConmirmedPass = document.getElementById('newPassConfirmed').value
    var encripPass = localStorage.getItem('password')
    const encoder = new TextEncoder()
    if (encoder.encode(oldPass) == encripPass) {
        if (newPass != '' && newConmirmedPass != '') {
            if (newPass === newConmirmedPass) {
                localStorage.removeItem('password')
                localStorage.setItem('password', encoder.encode(newPass))
                alert('Contraseña cambiada')
                document.getElementById('oldPass').value = ''
                document.getElementById('newPass').value = ''
                document.getElementById('newPassConfirmed').value = ''
            } else {
                alert('Las nuevas contraseñas no coinciden')
            }
        } else {
            alert('Los campos no pueden estar vacíos')
        }
    } else {
        alert('La contraseña anterior NO es correcta')
    }
}

const indexedDb = window.indexedDB;
let db
const conexion = indexedDb.open('db_bar_code', 1)
conexion.onsuccess = () => {
    db = conexion.result
    console.log('Base de datos abierta', db)
    consultar()
}
conexion.onupgradeneeded = (e) => {
    db = e.target.result
    console.log('Base de datos creada', db)
    const coleccionObjetos = db.createObjectStore('tbl_codes', {
        keyPath: 'code' /* Nombre del campo, dentro del registro, qué será la identificación única */
    })
}
conexion.onerror = (error) => {
    console.log('Error ', error)
}
const agregar = (info) => {
    const trasaccion = db.transaction(['tbl_codes'], 'readwrite')
    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
    const conexion = coleccionObjetos.add(info)
    consultar()
}
const obtener = (clave) => {
    updateMode()
    const trasaccion = db.transaction(['tbl_codes'], 'readonly')
    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
    const conexion = coleccionObjetos.get(`${clave}`)

    conexion.onsuccess = (e) => {
        document.getElementById('txtCompliteName').value = conexion.result.name
        document.getElementById('txtCode').value = conexion.result.code
    }

}
const actualizar = (data) => {
    const trasaccion = db.transaction(['tbl_codes'], 'readwrite')
    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
    const conexion = coleccionObjetos.put(data)

    conexion.onsuccess = () => {
        consultar()
    }
}
const eliminar = (clave) => {
    if (confirm('¿Está seguro de borrar este registro?')) {
        const trasaccion = db.transaction(['tbl_codes'], 'readwrite')
        const coleccionObjetos = trasaccion.objectStore('tbl_codes')
        const conexion = coleccionObjetos.delete(`${clave}`)
        conexion.onsuccess = () => {
            consultar()
        }
    }

}
const consultar = () => {
    initMode()
    const trasaccion = db.transaction(['tbl_codes'], 'readonly')
    const coleccionObjetos = trasaccion.objectStore('tbl_codes')
    const conexion = coleccionObjetos.openCursor()
    var counter = 1
    var dataTable = ``
    document.getElementById('tBody').innerHTML = ``
    conexion.onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
            dataTable += `
                <tr>
                    <th scope="col">${counter}</th>
                    <td>${cursor.value.code}</td>
                    <td>${cursor.value.name}</td>
                    <td>
                    <center>
                        <button class="btn btn-danger" onclick="eliminar(${cursor.value.code})" >Eliminar</button>
                        <button class="btn btn-primary" onclick="obtener(${cursor.value.code})" >Actualizar</button>
                    </center>                
                    </td>
                </tr>
            `
            counter++
            cursor.continue()
        } else {
            document.getElementById('tBody').innerHTML = dataTable
            $('#table').DataTable();
        }
    }

}
