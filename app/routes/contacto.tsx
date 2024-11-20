import {useLoaderData, type MetaFunction} from '@remix-run/react';
import { useState } from 'react';


export const meta: MetaFunction = () => {
    return [{title: `NasaByTechZone | Contacto`}];
};

export class ContactModel{
    public name: string = '';
    public lastname: string = '';
    public email: string = '';
    public phone: string = '';
    public subject: string = '';
    public message: string = '';
}

const ContactoPage = () => {
    const [dataContact,setDataContact] = useState<ContactModel>(new ContactModel());


    const sendContact = (e:any) => {
        e.preventDefault();
        alert("Hola");
    }


    return(
        <div className='contacto-page'>
            <div className='container-form'>
                <h1>Contacto</h1>
                <form onSubmit={sendContact}>
                    <div className="form-group">
                        <label htmlFor="nombre" className="form-label">Nombre (S) *</label>
                        <input 
                            type="text" 
                            name="nombre" 
                            id="name" 
                            required
                            value={dataContact.name} 
                            onChange={(e:any) => {
                                setDataContact({
                                    ...dataContact,
                                    name: e.target.value
                                })
                            }} 
                            className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="apellidos" className="form-label">Apellidos*</label>
                        <input 
                            type="text" 
                            name="apellidos" 
                            id="lastname" 
                            required
                            value={dataContact.lastname} 
                            onChange={(e:any) => {
                                setDataContact({
                                    ...dataContact,
                                    lastname: e.target.value
                                })
                            }} 
                            className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="correo" className="form-label">Correo Electrónico*</label>
                        <input 
                            type="email" 
                            name="correo" 
                            id="email" 
                            required
                            value={dataContact.email} 
                            onChange={(e:any) => {
                                setDataContact({
                                    ...dataContact,
                                    email: e.target.value
                                })
                            }} 
                            className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="asunto" className="form-label">Asunto*</label>
                        <input 
                            type="text" 
                            name="asunto" 
                            id="subject" 
                            required
                            value={dataContact.subject} 
                            onChange={(e:any) => {
                                setDataContact({
                                    ...dataContact,
                                    subject: e.target.value
                                })
                            }} 
                            className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="mensaje" className="form-label">Mensaje*</label>
                        <textarea 
                            rows={6}
                            name="mensaje" 
                            id="message" 
                            required
                            value={dataContact.message} 
                            onChange={(e:any) => {
                                setDataContact({
                                    ...dataContact,
                                    message: e.target.value
                                })
                            }} 
                            className="form-input" />
                    </div>
                    <div className="form-group">
                        <input type='submit' className='input-button-submit' title='Enviar'/>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ContactoPage;

