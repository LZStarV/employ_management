<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="60%"
  >
    <el-form
      ref="employeeFormRef"
      :model="employeeForm"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="姓氏" prop="first_name">
            <el-input 
              v-model="employeeForm.first_name" 
              placeholder="请输入姓氏" 
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="名字" prop="last_name">
            <el-input 
              v-model="employeeForm.last_name" 
              placeholder="请输入名字" 
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="employeeForm.email" 
              placeholder="请输入邮箱" 
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="电话" prop="phone">
            <el-input 
              v-model="employeeForm.phone" 
              placeholder="请输入电话" 
            />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="部门" prop="department_id">
            <el-select
              v-model="employeeForm.department_id"
              placeholder="请选择部门"
            >
              <el-option
                v-for="dept in departmentsData"
                :key="dept.department_id"
                :label="dept.department_name"
                :value="dept.department_id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职位" prop="position_id">
            <el-select
              v-model="employeeForm.position_id"
              placeholder="请选择职位"
            >
              <el-option
                v-for="pos in positionsData"
                :key="pos.position_id"
                :label="pos.position_name"
                :value="pos.position_id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="入职日期" prop="hire_date">
            <el-date-picker
              v-model="employeeForm.hire_date"
              type="date"
              placeholder="选择入职日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select
              v-model="employeeForm.status"
              placeholder="请选择状态"
            >
              <el-option label="在职" value="active" />
              <el-option label="离职" value="resigned" />
              <el-option label="休假" value="on_leave" />
              <el-option label="停用" value="inactive" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="地址" prop="address">
        <el-input
          v-model="employeeForm.address"
          type="textarea"
          :rows="3"
          placeholder="请输入地址"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import employeeApi from '../api/employeeApi'

export default {
  name: 'EmployeeEditDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    employeeData: {
      type: Object,
      default: () => ({})
    },
    departments: {
      type: Array,
      default: () => []
    },
    positions: {
      type: Array,
      default: () => []
    },
    isEditMode: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const employeeFormRef = ref(null)
    
    // 员工表单
    const employeeForm = reactive({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: '',
      position_id: '',
      hire_date: '',
      status: 'active',
      address: ''
    })
    
    // 表单验证规则
    const formRules = {
      first_name: [
        { required: true, message: '请输入姓氏', trigger: 'blur' }
      ],
      last_name: [
        { required: true, message: '请输入名字', trigger: 'blur' }
      ],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
      ],
      department_id: [
        { required: true, message: '请选择部门', trigger: 'change' }
      ],
      position_id: [
        { required: true, message: '请选择职位', trigger: 'change' }
      ],
      hire_date: [
        { required: true, message: '请选择入职日期', trigger: 'change' }
      ]
    }
    
    // 计算对话框标题
    const dialogTitle = ref('添加员工')
    
    // 计算对话框显示状态
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    // 创建响应式变量来存储props值
    const isEditMode = ref(props.isEditMode)
    const employeeData = ref(props.employeeData)
    const departmentsData = ref(props.departments)
    const positionsData = ref(props.positions)
    
    // 监听props变化
    const updateFromProps = () => {
      isEditMode.value = props.isEditMode
      employeeData.value = props.employeeData
      departmentsData.value = props.departments
      positionsData.value = props.positions
      
      dialogTitle.value = isEditMode.value ? '编辑员工' : '添加员工'
      
      if (isEditMode.value && employeeData.value) {
        // 编辑模式：复制数据
        Object.assign(employeeForm, employeeData.value)
        // 处理日期格式
        if (employeeData.value.hire_date) {
          employeeForm.hire_date = new Date(employeeData.value.hire_date)
        }
      } else {
        // 添加模式：重置表单
        resetForm()
      }
    }
    
    // 监听props变化
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        updateFromProps()
      }
    })
    
    // 监听employeeData变化
    watch(() => props.employeeData, (newVal) => {
      if (props.modelValue && props.isEditMode) {
        updateFromProps()
      }
    })
    
    // 重置表单
    const resetForm = () => {
      Object.keys(employeeForm).forEach(key => {
        employeeForm[key] = ''
      })
      employeeForm.status = 'active'
      if (employeeFormRef.value) {
        employeeFormRef.value.resetFields()
      }
    }
    
    // 处理取消
    const handleCancel = () => {
      emit('update:modelValue', false)
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        active: '在职',
        resigned: '离职',
        on_leave: '休假',
        inactive: '停用'
      }
      return statusMap[status] || status
    }
    
    // 处理保存
    const handleSave = async () => {
      try {
        await employeeFormRef.value.validate()
        
        // 处理日期格式
        const formData = { ...employeeForm }
        if (formData.hire_date) {
          formData.hire_date = formData.hire_date.toISOString().split('T')[0]
        }
        
        if (props.isEditMode) {
          // 编辑模式
          await employeeApi.updateEmployee(formData.employee_id, formData)
          ElMessage.success('员工信息更新成功')
        } else {
          // 添加模式
          await employeeApi.createEmployee(formData)
          ElMessage.success('员工添加成功')
        }
        
        emit('update:modelValue', false)
        emit('saved')
      } catch (error) {
        // 表单验证失败
      }
    }
    
    // 监听props变化
    updateFromProps()
    
    return {
      employeeFormRef,
      employeeForm,
      formRules,
      dialogTitle,
      dialogVisible,
      handleCancel,
      handleSave,
      getStatusText,
      departmentsData,
      positionsData
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>