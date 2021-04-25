import { 
	REPORT_CHANGE_TYPE,
	REPORT_CHANGE_SUBJECT,
	REPORT_CHANGE_GROUP,
	REPORT_CHANGE_TYPE_SUBJECT,
	REPORT_CHANGE_PRIORITY,

	REPORT_GET_DATA,
	REPORT_RENDER_DATA,
	REPORT_SAVE_DATA,
	
	REPORT_EDIT_CHANGE_STATE,
	REPORT_EDIT_ADD_CHANGE,
	REPORT_EDIT_TO_BACK,
	TEMPLATE_TOGGLE_EDIT,
	TEMPLATE_ADD_PART,
	TEMPLATE_ADD_STUDENT,
	REPORT_FULLUPDATE_DATA
} from "./types"

import { renderReport, getReport as actionGetReport, showNotification, fullUpdate } from "../actions"
import compileAndMake from "../../Components/PersonPage/Report/compile"

import { getReport, setReport } from "../../api"

function* filler(count, defaultValue){
	for (let i = 0; i < count; i++) {
		yield defaultValue
	}
}

var isValidGetRequest = (req) => {
	let access = false;
	if(   typeof req.nameTeacher 	            !== "undefined" && req.nameTeacher 	            != "" &&
			typeof req.group 			            !== "undefined" && req.group			            != "" &&
			typeof req.subject 		            !== "undefined" && req.subject		            != "" &&
			typeof req.duration 	               !== "undefined" && req.duration 	               != "" &&
			typeof req.typeReport 	            !== "undefined" && req.typeReport 	            != "" &&
			typeof req.typeSubject 	            !== "undefined" && (req.typeSubject	            != "undefined" || req.typeSubject != "-1")
	){
		access = true;
	}
	console.log("It's not valid")
	return access;
}
var getRequestWithAccess = (req, accessCB, errorCB) => {
	if(isValidGetRequest(req)){
		getReport({
			nameTeacher:      req.nameTeacher,
			nameSubject:      req.subject,
			nameGroup:        req.group,
			typeReport:       req.typeReport,
			typeSubject: 		req.typeSubject,
			durationSubject: 	req.duration
		}, accessCB, errorCB)
	}
}

export const reports = (state = {
	subject: "",
	group: "",
	typeSubject: "NONE_TYPE",
	typeReport: "att",
	priority: "subjects",
	duration: "ALL_SEMESTER",
	template: {
		isEdit: false,
		data: [],
		lastColIndex: 3
	},
	data: {
		thead: [],
		meta: {
			curCol: 0
		},
		xlsx: {
			data: [],
			columns: []
		}
	},
	edit: {
		changes: [],
		isEdit: false,
		active: {
			row: -1,
			col: -1
		}
	}
}, action) => {

	switch(action.type){
		case REPORT_CHANGE_TYPE:
			return {
				...state,
				typeReport: action.payload,
				// clear fields
				data: {xlsx: {data: [], columns: []}, thead: [], meta: {curCol: 0}},
				edit: {
					changes: [],
					isEdit: false,
					active: {
						row: -1,
						col: -1
					}
				}
			}
		case REPORT_CHANGE_SUBJECT:
			return{
				...state,
				subject: action.payload.subject,
				duration: action.payload.duration,
				// group: ""
			}
		case REPORT_CHANGE_TYPE_SUBJECT:
				return {
					...state,
					typeSubject: action.payload
				}
		case REPORT_CHANGE_GROUP: 
				return{
					...state,
					group: action.payload
				}
		case REPORT_CHANGE_PRIORITY:
			return{
				...state,
				priority: action.payload
			}
		case REPORT_GET_DATA:
			getRequestWithAccess({...state, nameTeacher: action.payload}, (data)=>{
				// action.asyncDispatch(renderReport({data: [], thead:[]}))
				action.asyncDispatch(renderReport(data))
			}, error => {
				action.asyncDispatch(renderReport({xlsx: {data: [], columns: []}}))
				action.asyncDispatch(showNotification({
					title: "Ошибка вышла",
					content: "Не удалось загрузить ведомость",
					type: "error"
				}))
			})
			return state
		case REPORT_RENDER_DATA:
			console.log(action.payload)
			return {
				...state,
				data: action.payload
			}

		case REPORT_SAVE_DATA:
			console.log(action.payload)
			let table = state.data.xlsx.data
			action.payload.changes.map(change => {
				console.log(!!change.allCol)
				if(!!change.allCol){
					console.log(change, table)
					for (let i = 0; i < table.length; i++)
						table[i][change.col] = change.value
				}
				else{
					table[change.row][change.col] = change.value
				}
			})
			setReport({
				...state.data.report_data,
				...state.data,
				xlsx: {
					...state.data.xlsx,
					data: table
				}
			}, success => {
				action.asyncDispatch(showNotification({
					title: `Вел дан!`,
					content: "Ведомость сохранена",
					type: "success",
					autohide: true
				}))
			}, error => {
				action.asyncDispatch(showNotification({
					title: `Ошибка вышла`,
					content: "Не удалось сохранить ведомость",
					type: "error"
				}))
			})
			return {
				...state,
				edit: {
					...state.edit,
					changes: []
				}
			}
		// edit report and sending it on server
		case REPORT_EDIT_CHANGE_STATE:
			return {
				...state,
				edit: {
					// isEdit: action.payload
					...state.edit,
					isEdit: !state.edit.isEdit
				}
			}
		case REPORT_EDIT_ADD_CHANGE:
			const changes = state.edit.changes
			let indexCol = -1
			changes.map((item, index) => {
				if(item.col == action.payload.col && !!item.allCol) indexCol = index
			})
			if(~indexCol)
				changes[indexCol].value = !!changes[indexCol].value? "": "+"
			else
				changes.push(action.payload)
			action.asyncDispatch(fullUpdate())
			return{
				...state,
				edit: {
					...state.edit,
					changes: changes
				}
			}
		case REPORT_EDIT_TO_BACK:
			return {
				...state,
				edit: {
					...state.edit,
					changes: state.edit.changes.slice(0, state.edit.changes.length-1)
				}
			}
		case REPORT_FULLUPDATE_DATA:
			const thead = state.data.thead
			const curCol = state.data.meta.curCol
			const concatChanges = (row, col) => {
				if(state.edit.changes.length > 0){
					for (let i = state.edit.changes.length - 1; i >= 0; i--) {
						let item = state.edit.changes[i]
						// if(!!item.allCol && item.col == col) return item.value // for all col
						if(item.row == row && item.col == col) return item.value
					}
				}
				return state.data.xlsx.data[row][col]
			}
			let _table = []
			state.data.xlsx.data.map((row, Irow) => {
				_table[Irow] = []
				row.map((col, Icol) => _table[Irow].push(concatChanges(Irow, Icol)))
			})

			thead.map((th, Icol) => {
				if(!!th.formula){
					_table.map((row, Irow) => {
						_table[Irow][Icol] = compileAndMake(th.formula, curCol)(_table, Irow)
					})
				}
			})
			return {
				...state,
				data: {
					...state.data,
					xlsx: {
						...state.data.xlsx,
						data: _table
					}
				}
			}

		// TEMPLATE

		case TEMPLATE_TOGGLE_EDIT:
			return {
				...state,
				template: {
					...state.template,
					isEdit: !state.template.isEdit
				}
			}
		case TEMPLATE_ADD_PART:
			return {
				...state,
				template: {
					...state.template,
					data: [...state.template.data, {
						name: action.payload,
						enable: false
					}]
				}
			}
		case TEMPLATE_ADD_STUDENT:
			return {
				...state,
				data: {
					...state.data,
					data: [
						...state.data.data,
						[state.data.data.length+1, action.payload, ...filler(state.data.data[0].length-2, "")]
					]
				}
			}
		default: 
			return state
	}
}