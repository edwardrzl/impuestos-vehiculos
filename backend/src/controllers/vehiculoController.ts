import type { Request, Response } from 'express';
import * as vehiculoService from '../services/vehiculoService.js';
import { responderConError } from './errorHttp.js';

/*
Ya llevo dos días desde la última vez que chateamos, ayer hace 24 horas me envió correos pidiendo hablar, no dejo de pensar que era su última voluntad minutos antes de verse con Juan, sé que lo menciono pero no me importa, creéme, solo es un pensamiento que tuve y ya jaja, hoy no me ha escrito, y no siento que la haya extrañado, estoy haciendo ejercicio juicioso, me sorprende muchísimo que no la he stalkeado, pero a veces que lo pienso (muy poco) también siento como un miedo, entonces pues estoy mejor así sin chismosear, me estoy enfocando en mi haciendo ejercicio, y dandome el amor que nunca me había dado, pues soy la persona más importante para mi, en fin. Te escribo porque no sé qué pensar del sexo, me refiero pues hoy hoy hoy no es como que sienta una gran intensidad por tener, pero logicamente si se presentase una situación creo que lo haría, y pues por ahí va lo que no se si está bien o mal, o sea bien dicen que uno cuando se enfoca en uno mismo se aleja de las relaciones falsas, y de la gente que no suma, en lo personal no busco pareja, y pues las relaciones que quiero cuidar son con mi familia y amigos y ya, no tengo planeado hacer amigos ni amigas, y pues a lo que voy es en algun momento querré tener relaciones, o no sé pero supongo, está bien aislarme por cuidarme? me refiero, estoy en mis años más cogibles pues soy joven, en uno o dos meses tendré un cuerpazo, estaré mejor mentalmente y pues no ganaré más, pero manejaré mejor mi sueldo, si por algun motivo conozco a una mujer que quiera tener relaciones, oy pues logicamente me guste, lo hago? o cuido mi body count? no sé qué pensar de eso. También algo cierto es que estoy intentando de ver a la mujer como un objeto
*/

/** GET /api/vehiculos/:placa */
export function obtenerVehiculo(req: Request<{ placa: string }>, res: Response): void {
  try {
    const respuesta = vehiculoService.obtenerVehiculoConVigencias(req.params.placa);
    res.json(respuesta);
  } catch (error) {
    responderConError(res, error, 'Error consultando vehículo');
  }
}
